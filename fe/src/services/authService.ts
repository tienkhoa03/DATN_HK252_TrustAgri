/**
 * authService — gọi thực tế tới Auth Service qua API Gateway.
 *
 * Endpoints (design.md §4.1):
 *   POST  /api/v1/auth/login   { zaloAccessToken } → { accessToken, refreshToken, userId, role, expiresAt }
 *   POST  /api/v1/auth/verify  {} (Bearer header)  → { userId, role, valid: true }
 *   POST  /api/v1/auth/logout  {}                  → { success: true }
 *   GET   /api/v1/auth/me                          → UserProfileDto
 *   PUT   /api/v1/auth/me      UserProfileUpdateDto → UserProfileDto
 *
 * Tất cả trường JSON đều camelCase theo quy ước backend (design.md §1.1).
 */

import apiClient from '@/api/client';
import type { AuthSession } from '@/state/authAtoms';

// ── DTO types (mirror design.md §4.1) ─────────────────────────────────────────

export interface UserProfileDto {
  userId: string;
  zaloId: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  traderProfile?: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  };
  farmerProfile?: {
    region: string;
    experienceYears: number;
  };
  buyerProfile?: {
    organizationName?: string;
  };
  createdAt: string;
  lastLogin: string;
}

export type UserProfileUpdateDto = Partial<
  Pick<UserProfileDto, 'displayName' | 'phone' | 'email' | 'avatarUrl' | 'traderProfile' | 'farmerProfile' | 'buyerProfile'>
>;

export interface VerifyResponseDto {
  userId: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  valid: true;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/password-login
 * Đăng nhập bằng username/password. Yêu cầu AUTH_PASSWORD_LOGIN_ENABLED=true ở backend.
 */
export async function passwordLogin(username: string, password: string): Promise<AuthSession> {
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: 'farmer' | 'trader' | 'buyer' | 'guest';
    expiresAt: string;
  }>('/auth/password-login', { username, password });

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
    role: data.role,
    expiresAt: data.expiresAt,
  };
}

/**
 * POST /api/v1/auth/login
 * Exchanges a Zalo access token (from ZMP SDK) for a TrustAgri session.
 */
/**
 * POST /api/v1/auth/dev-login — JWT thật (chỉ dev backend: localhost + secret).
 */
export async function devLogin(secret: string, zaloId: string): Promise<AuthSession> {
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: 'farmer' | 'trader' | 'buyer' | 'guest';
    expiresAt: string;
  }>('/auth/dev-login', { secret, zaloId });

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
    role: data.role,
    expiresAt: data.expiresAt,
  };
}

export async function login(zaloAccessToken: string): Promise<AuthSession> {
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: 'farmer' | 'trader' | 'buyer' | 'guest';
    expiresAt: string;
  }>('/auth/login', { zaloAccessToken });

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
    role: data.role,
    expiresAt: data.expiresAt,
  };
}

/**
 * POST /api/v1/auth/verify
 * Validates the current bearer token (injected by the request interceptor).
 * Pass an explicit token to override the interceptor — useful for smoke tests
 * before the Jotai session is initialised.
 */
export async function verify(bearerToken?: string): Promise<VerifyResponseDto> {
  const config = bearerToken
    ? { headers: { Authorization: `Bearer ${bearerToken}` } }
    : undefined;
  const { data } = await apiClient.post<VerifyResponseDto>('/auth/verify', {}, config);
  return data;
}

/**
 * POST /api/v1/auth/logout
 * Invalidates the current session server-side.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {});
}

/**
 * GET /api/v1/auth/me
 * Returns the full profile of the authenticated user.
 */
export async function getMe(bearerToken?: string): Promise<UserProfileDto> {
  const config = bearerToken
    ? { headers: { Authorization: `Bearer ${bearerToken}` } }
    : undefined;
  const { data } = await apiClient.get<UserProfileDto>('/auth/me', config);
  return data;
}

/**
 * PUT /api/v1/auth/me
 * Partial update of the user's own profile.
 */
export async function updateMe(patch: UserProfileUpdateDto): Promise<UserProfileDto> {
  const { data } = await apiClient.put<UserProfileDto>('/auth/me', patch);
  return data;
}
