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

  // Tin cậy 1 hop proxy (nginx) để đọc X-Forwarded-For / IP thật cho dev-login & audit
  const httpServer = app.getHttpAdapter().getInstance();
  if (typeof httpServer?.set === 'function') {
    httpServer.set('trust proxy', 1);
  }

  const port = process.env.PORT ?? process.env.AUTH_SERVICE_PORT ?? 3001;
  await app.listen(port);
  console.log(
    JSON.stringify({
      level: 'info',
      message: `auth-service listening on port ${port}`,
      timestamp: new Date().toISOString(),
    }),
  );
}

bootstrap();
