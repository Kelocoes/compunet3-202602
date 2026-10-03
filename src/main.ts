import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppLogger } from './common/logger/logger.service';
import { AppModule } from './app.module';
import { CryptoInterceptor } from './common/interceptors/crypto.interceptor';
import { TraceabilityInterceptor } from './common/interceptors/traceability.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true, //logs de inicio en buffer temporal hasta que applogger este completamente instanciado
    });

    const appLogger = app.get(AppLogger);
    app.useLogger(appLogger);

    //registro de interceptores
    app.useGlobalInterceptors(new CryptoInterceptor());
    app.useGlobalInterceptors(new TraceabilityInterceptor(appLogger));

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    appLogger.log(`Servidor iniciado exitosamente en el puerto ${port}`);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Remueve propiedades que no estén en el DTO
            forbidNonWhitelisted: true, // Lanza error si se envían propiedades no reconocidas
            transform: true, // Transforma automáticamente los payloads a instancias de sus DTOs
        }),
    );

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
    console.error(error);
});
