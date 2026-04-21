import type { UserRole } from '@/state/authAtoms';

/** Trang chủ mặc định theo vai trò (điều hướng khi không đủ quyền). */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  farmer: '/farmer',
  trader: '/trader',
  buyer: '/buyer',
  guest: '/guest',
};
