/**
 * useAuth — hook quản lý phiên xác thực TrustAgri (Phase 1.2 — Integration).
 *
 * Luồng thật:
 *  1. login()  → getAccessToken() từ ZMP SDK → POST /api/v1/auth/login → lưu AuthSession vào Jotai
 *               → GET  /api/v1/auth/me  → lưu UserProfileDto vào local state
 *  2. logout() → POST /api/v1/auth/logout → xóa session khỏi Jotai
 *  3. verify() → POST /api/v1/auth/verify (Bearer tự động từ interceptor)
 *
 * Xử lý 401: interceptor (interceptors.ts) đã xóa authSessionAtom khi nhận 401;
 * useAuth phản ánh trạng thái đó ngay lập tức vì đọc atom cùng store.
 *
 * DTO mapping: backend trả camelCase đúng design.md §1.1;
 * authService.ts map trực tiếp → không cần mapper thêm.
 */

import { useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';

import { authSessionAtom, currentRoleAtom, type AuthSession, type UserRole } from '@/state/authAtoms';
import * as authService from '@/services/authService';
import { resolveZaloAccessToken } from '@/services/zaloAccessToken';
import type { UserProfileDto } from '@/services/authService';
import { ApiError } from '@/api/errors';
import { ENV } from '@/config/env';
import { mockLogout } from '@/services/mockService';
import { bootstrapMockAuthSession, isMockOnlyJwt } from '@/services/mockAuthBootstrap';
import { disconnectMonitoringSocket } from '@/api/monitoringSocket';
import { resetAllStateOnLogout } from '@/state/resetOnLogout';

// ── Public interface ──────────────────────────────────────────────────────────

export type { UserProfileDto };

export interface UseAuthReturn {
  /** Phiên hiện tại; null nếu chưa đăng nhập. */
  session: AuthSession | null;
  /** Vai trò hiện tại (mặc định 'guest' khi chưa đăng nhập). */
  role: UserRole;
  /** Hồ sơ người dùng đầy đủ sau khi login thành công. */
  profile: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Thông báo lỗi tiếng Việt; null khi không có lỗi. */
  error: string | null;
  /**
   * Đăng nhập qua Zalo.
   * Tự động gọi getAccessToken() từ ZMP SDK rồi trao đổi với backend.
   */
  login: () => Promise<void>;
  /** Đăng xuất: gọi POST /api/v1/auth/logout rồi xóa session khỏi Jotai. */
  logout: () => Promise<void>;
  /**
   * Xác minh token hiện tại với backend (POST /api/v1/auth/verify).
   * Dùng khi cold start để kiểm tra phiên còn hợp lệ không.
   * Trả null và xóa session nếu token hết hạn (interceptor cũng xử lý 401).
   */
  verify: () => Promise<{ userId: string; role: UserRole; valid: boolean } | null>;
  /** Xóa thông báo lỗi thủ công. */
  clearError: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useAtom(authSessionAtom);
  const role = useAtomValue(currentRoleAtom);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── login ────────────────────────────────────────────────────────────────

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCK) {
        const { session: newSession, profile: userProfile } = await bootstrapMockAuthSession();
        setSession(newSession);
        setProfile(userProfile);
        return;
      }

      // Bước 1: Lấy Zalo access token từ ZMP SDK
      let zaloToken: string;
      try {
        zaloToken = await resolveZaloAccessToken();
      } catch {
        throw new Error(
          'Không lấy được token Zalo. Vui lòng đảm bảo ứng dụng đang chạy trong Zalo Mini App.',
        );
      }

      // Bước 2: Trao đổi Zalo token → TrustAgri session
      // POST /api/v1/auth/login { zaloAccessToken } → { accessToken, refreshToken, userId, role, expiresAt }
      const newSession: AuthSession = await authService.login(zaloToken);
      setSession(newSession);
      // Sau setSession, interceptor tự gắn Bearer token cho mọi request tiếp theo

      // Bước 3: Lấy hồ sơ đầy đủ
      // GET /api/v1/auth/me → UserProfileDto (camelCase, design.md §4.1)
      const userProfile = await authService.getMe();
      setProfile(userProfile);
    } catch (err) {
      // Roll back any partial session so the app doesn't enter a half-authenticated state
      setSession(null);
      setProfile(null);
      const message = toVietnameseError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  // ── logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (ENV.USE_MOCK && session && isMockOnlyJwt(session.accessToken)) {
        await mockLogout();
      } else if (session) {
        await authService.logout();
      }
    } catch {
      // Bỏ qua lỗi server; luôn xóa session local để tránh kẹt trạng thái
    } finally {
      setSession(null);
      setProfile(null);
      disconnectMonitoringSocket();
      resetAllStateOnLogout();
      setIsLoading(false);
    }
  }, [setSession, session]);

  // ── verify ───────────────────────────────────────────────────────────────

  const verify = useCallback(async () => {
    if (!session) return null;
    if (ENV.USE_MOCK && isMockOnlyJwt(session.accessToken)) {
      return { userId: session.userId, role: session.role, valid: true as const };
    }
    try {
      // POST /api/v1/auth/verify — Bearer được gắn tự động bởi interceptor
      const result = await authService.verify();
      return { userId: result.userId, role: result.role, valid: result.valid };
    } catch {
      // 401/invalid token → xóa session (interceptor đã làm, đây là safety net)
      setSession(null);
      setProfile(null);
      return null;
    }
  }, [session, setSession]);

  // ── clearError ───────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    role,
    profile,
    isAuthenticated: session !== null,
    isLoading,
    error,
    login,
    logout,
    verify,
    clearError,
  };
}

// ── Error → Vietnamese message ────────────────────────────────────────────────

function toVietnameseError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Tài khoản không có quyền truy cập. Vui lòng liên hệ quản trị viên.';
      case 'NOT_FOUND':
        return 'Không tìm thấy tài khoản. Vui lòng kiểm tra lại thông tin Zalo.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.';
      default:
        return err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}
