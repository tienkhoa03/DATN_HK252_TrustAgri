import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from '../filters/http-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuditWriteInterceptor } from '../interceptors/audit.interceptor';
import { requestIdMiddleware } from '../middleware/request-id.middleware';

/**
 * Cross-cutting Task 20.1: ValidationPipe, exception filter, guards, requestId, audit log, prefix.
 */
export function applyTrustagriHttpStack(app: INestApplication): void {
  const http = app.getHttpAdapter().getInstance();
  http.use(requestIdMiddleware);

  const reflector = app.get(Reflector);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new AuditWriteInterceptor());
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
}
