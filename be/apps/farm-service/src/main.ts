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

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? process.env.FARM_SERVICE_PORT ?? 3003;
  await app.listen(port);
  console.log(
    JSON.stringify({
      level: 'info',
      message: `farm-service listening on port ${port}`,
      timestamp: new Date().toISOString(),
    }),
  );
}

bootstrap();
