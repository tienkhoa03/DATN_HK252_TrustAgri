import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getClientIp, normalizeIp } from '../utils/client-ip';

/**
 * Loopback (đã normalize, không còn ::ffff:).
 * Lưu ý: gọi http://localhost:3006 từ máy host khi gateway chạy trong Docker thường không thấy 127.0.0.1
 * mà thấy IP bridge (vd. 172.17.0.1) trong X-Forwarded-For — xem DOCKER_HOST_SOURCES.
 */
const LOOPBACK = new Set(['127.0.0.1', '::1']);

/**
 * IP phổ biến khi trình duyệt trên host gọi cổng đã publish (3006→nginx):
 * nginx nhận kết nối từ Docker bridge, không phải loopback.
 */
const DOCKER_HOST_SOURCES = new Set([
  '172.17.0.1',
  '172.18.0.1',
  '192.168.65.1',
]);

/**
 * Dev-login chỉ cho phép từ loopback, IP bridge Docker host→container, hoặc DEV_LOGIN_ALLOW_IPS.
 */
@Injectable()
export class DevLocalhostGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = getClientIp(req);
    const allowExtra = this.parseAllowList();
    if (
      LOOPBACK.has(ip) ||
      DOCKER_HOST_SOURCES.has(ip) ||
      allowExtra.has(ip) ||
      allowExtra.has(normalizeIp(ip))
    ) {
      return true;
    }
    throw new ForbiddenException(
      `Dev login chỉ cho phép từ localhost / Docker host (IP: ${ip}). Cấu hình DEV_LOGIN_ALLOW_IPS nếu cần.`,
    );
  }

  private parseAllowList(): Set<string> {
    const raw = this.config.get<string>('DEV_LOGIN_ALLOW_IPS', '');
    if (!raw.trim()) {
      return new Set();
    }
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
}
