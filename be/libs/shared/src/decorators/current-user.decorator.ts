import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../dto/auth.dto';

/**
 * Lấy user hiện tại từ JWT payload đã xác thực
 * @example @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
