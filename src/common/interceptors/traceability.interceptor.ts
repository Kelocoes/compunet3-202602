import * as crypto from 'crypto';
import { STATUS_CODES } from 'http';

import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AppLogger, correlationStorage } from '../logger/logger.service';

export interface CorrelatedRequest extends Request {
    correlationId: string;
}

@Injectable()
export class TraceabilityInterceptor implements NestInterceptor {
    constructor(private readonly logger: AppLogger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const startTime = Date.now();
        const http = context.switchToHttp();
        const request = http.getRequest<CorrelatedRequest>();
        const response = http.getResponse<Response>();

        const header = request.headers['x-correlation-id'];
        const correlationId = typeof header === 'string' && header ? header : crypto.randomUUID();

        request.correlationId = correlationId;
        response.setHeader('x-correlation-id', correlationId);

        const logTrace = (statusCode: number) => {
            const duration = Date.now() - startTime;
            correlationStorage.exit(() =>
                this.logger.log(
                    `[TRACE] [${request.method} ${request.originalUrl}] [${statusCode} ${STATUS_CODES[statusCode]}] [Duration: ${duration}ms] [CorrelationID: ${correlationId}]`,
                ),
            );
        };

        return new Observable<unknown>((subscriber) => {
            return correlationStorage.run(correlationId, () => next.handle().subscribe(subscriber));
        }).pipe(
            tap({
                next: () => logTrace(response.statusCode),
                error: (error: unknown) => logTrace(error instanceof HttpException ? error.getStatus() : 500),
            }),
        );
    }
}
