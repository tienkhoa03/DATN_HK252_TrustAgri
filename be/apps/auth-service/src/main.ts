import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter, JwtAuthGuard, RolesGuard } from '@trustagri/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  const reflector = app.get(Reflector);

  // Global ValidationPipe — whitelist + transform (design.md §8)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter → ErrorResponse chuẩn (design.md §1.2)
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Global guards
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.setGlobalPrefix('api/v1');

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
