/**
 * useProfile — hook quản lý hồ sơ người dùng (Phase 2.2 — Integration).
 *
 * Luồng thật:
 *  - mount  → GET  /api/v1/auth/me  (Bearer được gắn tự động bởi interceptor)
 *  - update → PUT  /api/v1/auth/me  { patch }  → trả UserProfileDto mới
 *
 * Xử lý lỗi:
 *  - ApiError → thông báo tiếng Việt qua `error` string (component hiển thị Snackbar)
 *  - 401 → interceptor đã xóa authSessionAtom; error state chứa thông báo thân thiện
 *  - 400 → INVALID_INPUT với hint thao tác lại
 *
 * DTO mapping (design.md §4.1, §1.1):
 *  - Backend trả camelCase → authService.ts map 1-1 → không cần mapper thêm.
 *  - UserProfileDto: userId, zaloId, role, displayName, phone?, email?,
 *    avatarUrl?, traderProfile?, farmerProfile?, buyerProfile?, createdAt, lastLogin.
 *
 * ZMP SDK:
 *  - Token Zalo đã được trao đổi ở Phase 1 (login); lưu trong authSessionAtom.
 *  - Interceptor tự đọc accessTokenAtom và gắn Authorization: Bearer — không cần
 *    gọi thêm ZMP SDK getAccessToken() trong phase này.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import * as authService from '@/services/authService';
import type { UserProfileDto, UserProfileUpdateDto } from '@/services/authService';
import { ApiError } from '@/api/errors';
import { ENV } from '@/config/env';
import { authSessionAtom } from '@/state/authAtoms';
import { mockGetMe, mockUpdateMe } from '@/services/mockService';
import { isMockOnlyJwt } from '@/services/mockAuthBootstrap';

export type { UserProfileDto, UserProfileUpdateDto };

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseProfileReturn {
  /** Hồ sơ đã tải; null khi chưa tải xong hoặc lỗi. */
  profile: UserProfileDto | null;
  /** True trong lần tải đầu tiên. */
  isLoading: boolean;
  /** True khi đang gọi PUT /auth/me. */
  isSaving: boolean;
  /** Thông báo lỗi tiếng Việt; null khi không có lỗi. */
  error: string | null;
  /**
   * Cập nhật hồ sơ — gọi PUT /api/v1/auth/me với patch.
   * Trả true nếu thành công, false nếu lỗi (error state được set).
   */
  updateProfile: (patch: UserProfileUpdateDto) => Promise<boolean>;
  /** Tải lại hồ sơ từ server. */
  refresh: () => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile(): UseProfileReturn {
  const session = useAtomValue(authSessionAtom);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── GET /api/v1/auth/me ──────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (ENV.USE_MOCK) {
        if (!session) {
          setProfile(null);
          return;
        }
        if (isMockOnlyJwt(session.accessToken)) {
          const data = await mockGetMe(session.role);
          setProfile(data);
          return;
        }
        const data = await authService.getMe();
        setProfile(data);
        return;
      }
      const data = await authService.getMe();
      setProfile(data);
    } catch (err) {
      setError(toVietnameseError(err, 'load'));
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // ── PUT /api/v1/auth/me ──────────────────────────────────────────────────

  const updateProfile = useCallback(async (patch: UserProfileUpdateDto): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      if (ENV.USE_MOCK) {
        if (!profile || !session) return false;
        if (isMockOnlyJwt(session.accessToken)) {
          const updated = await mockUpdateMe(profile, patch);
          setProfile(updated);
          return true;
        }
        const updated = await authService.updateMe(patch);
        setProfile(updated);
        return true;
      }
      const updated = await authService.updateMe(patch);
      setProfile(updated);
      return true;
    } catch (err) {
      setError(toVietnameseError(err, 'update'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile, session]);

  return { profile, isLoading, isSaving, error, updateProfile, refresh: fetchProfile };
}

// ── Error → Vietnamese message ────────────────────────────────────────────────

type ErrorContext = 'load' | 'update';

function toVietnameseError(err: unknown, ctx: ErrorContext): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Không có quyền truy cập hồ sơ này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy hồ sơ người dùng. Vui lòng liên hệ hỗ trợ.';
      case 'INVALID_INPUT':
        return ctx === 'update'
          ? 'Thông tin cập nhật không hợp lệ. Vui lòng kiểm tra và thử lại.'
          : 'Yêu cầu không hợp lệ. Vui lòng thử lại.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'INTERNAL_ERROR':
        return 'Lỗi máy chủ nội bộ. Vui lòng thử lại hoặc liên hệ hỗ trợ.';
      default:
        return err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}
