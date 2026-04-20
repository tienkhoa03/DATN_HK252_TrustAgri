import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto/auth.dto';

export const ROLES_KEY = 'roles';

/**
 * Gán danh sách role được phép truy cập endpoint
 * @example @Roles('trader', 'admin')
 */
export const Roles = (...roles: UserRole[]): MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);
