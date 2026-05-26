import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Ghi nhật ký audit cho thao tác ghi (HTTP method) kèm requestId và userId (JWT).
 */
@Injectable()
export class AuditWriteInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditWriteInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string; user?: unknown }>();

    if (!WRITE_METHODS.has(req.method)) {
      return next.handle();
    }

    const requestId =
      req.requestId ??
      (typeof req.headers['x-request-id'] === 'string'
        ? req.headers['x-request-id']
        : undefined) ??
      'unknown';
    const path = req.route?.path ?? req.path ?? req.url ?? '';
    const jwtUser = req.user as { sub?: string } | undefined;
    const userId = jwtUser?.sub ?? 'anonymous';

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'audit',
            type: 'audit',
            method: req.method,
            path,
            requestId,
            userId,
          }),
        );
      }),
    );
  }
}
