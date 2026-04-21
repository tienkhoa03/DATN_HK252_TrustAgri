import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Chỉ cho phép dev-login khi NODE_ENV !== production và AUTH_DEV_LOGIN_ENABLED=true.
 */
@Injectable()
export class DevLoginEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev login bị vô hiệu hóa trong production');
    }
    if (this.config.get<string>('AUTH_DEV_LOGIN_ENABLED') !== 'true') {
      throw new ForbiddenException('Dev login không được bật (AUTH_DEV_LOGIN_ENABLED)');
    }
    return true;
  }
}
