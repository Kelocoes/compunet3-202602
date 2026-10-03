import * as crypto from 'crypto';

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Response } from 'express';

import { AppLogger } from '../logger/logger.service';
import { CustomRequest } from '../interfaces/custom-request.interface';

@Injectable()
export class TraceabilityInterceptor implements NestInterceptor {
    constructor(private readonly logger: AppLogger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<CustomRequest>();
        const response = httpContext.getResponse<Response>();

        const incomingHeader = request.headers['x-correlation-id'];
        const correlationId = typeof incomingHeader === 'string' ? incomingHeader : crypto.randomUUID();

        request.correlationId = correlationId;
        response.setHeader('x-correlation-id', correlationId);

        const startTime = Date.now();
        const { method, url } = request;

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;

                this.logger.log(
                    `[TRACE] [${method} ${url}] [${statusCode} OK] [Duration: ${duration}ms] [CorrelationID: ${correlationId}]`,
                );
            }),
            catchError((err: unknown) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode || 500;

                // 🚀 SOLUCIÓN AL ERROR DE ESLINT:
                // Normalizamos el error comprobando si es una instancia de Error.
                // Si no lo es, creamos un nuevo Error con la representación en texto.
                const normalizedError = err instanceof Error ? err : new Error(String(err));

                this.logger.error(
                    `[TRACE ERROR] [${method} ${url}] [${statusCode}] [Duration: ${duration}ms] [CorrelationID: ${correlationId}]`,
                    normalizedError.stack,
                );

                // Retornamos la excepción tipeada correctamente
                return throwError(() => normalizedError);
            }),
        );
    }
}
