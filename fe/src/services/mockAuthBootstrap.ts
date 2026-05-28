/**
 * Khi VITE_USE_MOCK=true: khởi tạo phiên — hoặc JWT thật (dev-login + secret) hoặc token mock thuần.
 */

import { ENV } from '@/config/env';
import * as authService from '@/services/authService';
import { resolveZaloAccessToken } from '@/services/zaloAccessToken';
import { mockGetMe, mockLogin } from '@/services/mockService';
import { inferMockRoleFromToken, mockZaloIdForRole } from '@/services/mocks/mockAuthService';
import type { AuthSession } from '@/state/authAtoms';
import type { UserProfileDto } from '@/services/authService';

export async function resolveZaloTokenForMock(): Promise<string> {
  if (ENV.ZALO_API_KEY) {
    return ENV.ZALO_API_KEY;
  }
  try {
    return await resolveZaloAccessToken();
  } catch {
    return 'farmer';
  }
}

/** JWT do mockLogin tạo — không dùng được với API thật. */
export function isMockOnlyJwt(accessToken: string | undefined): boolean {
  return !!accessToken && accessToken.startsWith('mock.');
}

export async function bootstrapMockAuthSession(): Promise<{
  session: AuthSession;
  profile: UserProfileDto;
}> {
  const zaloToken = await resolveZaloTokenForMock();
  const role = inferMockRoleFromToken(zaloToken);

  if (ENV.DEV_LOGIN_SECRET) {
    const zaloId = ENV.DEV_LOGIN_ZALO_ID || mockZaloIdForRole(role);
    const session = await authService.devLogin(ENV.DEV_LOGIN_SECRET, zaloId);
    const profile = await authService.getMe(session.accessToken);
    return { session, profile };
  }

  const loginRes = await mockLogin(zaloToken);
  const session: AuthSession = {
    accessToken: loginRes.accessToken,
    refreshToken: loginRes.refreshToken,
    userId: loginRes.userId,
    role: loginRes.role,
    roles: [loginRes.role],
    expiresAt: loginRes.expiresAt,
  };
  const profile = await mockGetMe(loginRes.role);
  return { session, profile };
}
