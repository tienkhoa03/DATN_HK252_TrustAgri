import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyTrustagriHttpStack, corsOrigins } from '@trustagri/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Client-Api-Contract-Version',
    ],
  });

  applyTrustagriHttpStack(app);

  const port = process.env.PORT ?? process.env.NOTIFICATION_SERVICE_PORT ?? 3002;
  await app.listen(port);
  console.log(
    JSON.stringify({
      level: 'info',
      message: `notification-service listening on port ${port}`,
      timestamp: new Date().toISOString(),
    }),
  );
}

bootstrap();
