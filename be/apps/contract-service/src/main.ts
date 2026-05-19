import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { applyTrustagriHttpStack, corsOriginsOrAllowAll } from '@trustagri/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: corsOriginsOrAllowAll(),
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

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TrustAgri Contract Service')
      .setDescription('Contracts, orders, proposals, connections, buying requests')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT ?? process.env.CONTRACT_SERVICE_PORT ?? 3004;
  await app.listen(port);
  console.log(
    JSON.stringify({
      level: 'info',
      message: `contract-service listening on port ${port}`,
      timestamp: new Date().toISOString(),
    }),
  );
}

bootstrap();
