import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Gán correlation id: ưu tiên header X-Request-Id (Gateway/nginx), sinh UUID nếu thiếu.
 */
export function requestIdMiddleware(
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim()
      : randomUUID();
  req.headers['x-request-id'] = id;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
