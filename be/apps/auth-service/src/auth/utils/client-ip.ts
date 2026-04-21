import type { Request } from 'express';

/**
 * IP client sau reverse proxy (nginx: X-Forwarded-For, X-Real-IP).
 * Cần `app.set('trust proxy', 1)` trong main.ts khi đứng sau gateway.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return normalizeIp(forwarded.split(',')[0].trim());
  }
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) {
    return normalizeIp(real.trim());
  }
  const raw = req.socket?.remoteAddress ?? req.ip ?? '';
  return typeof raw === 'string' ? normalizeIp(raw) : '';
}

/** Gộp ::ffff:127.0.0.1 → 127.0.0.1 để so khớp allowlist. */
export function normalizeIp(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  return ip;
}
