import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const HEADER = 'x-traceability-internal';

@Injectable()
export class TraceabilityInternalGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('TRACEABILITY_INTERNAL_SECRET');
    if (!secret) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const got = req.headers[HEADER];
    const value = Array.isArray(got) ? got[0] : got;
    if (value !== secret) {
      throw new ForbiddenException('Truy cập nội bộ không hợp lệ');
    }
    return true;
  }
}
