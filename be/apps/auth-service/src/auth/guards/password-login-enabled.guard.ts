import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Chỉ cho phép password-login khi AUTH_PASSWORD_LOGIN_ENABLED=true.
 */
@Injectable()
export class PasswordLoginEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('AUTH_PASSWORD_LOGIN_ENABLED') !== 'true') {
      throw new ForbiddenException(
        'Đăng nhập bằng mật khẩu chưa được bật (AUTH_PASSWORD_LOGIN_ENABLED)',
      );
    }
    return true;
  }
}
