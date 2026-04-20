import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../dto/auth.dto';
import { JwtPayload } from '../dto/auth.dto';

/**
 * Role-based access guard — dùng sau JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!user) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);
    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
