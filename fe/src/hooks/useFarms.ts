/**
 * useFarms — hook quản lý CRUD hồ sơ vườn (Phase 3.2 — Integration).
 *
 * Luồng thật:
 *   load   → GET  /api/v1/farms           (Bearer gắn tự động bởi interceptor)
 *   create → POST /api/v1/farms
 *   update → PUT  /api/v1/farms/:id       (403 nếu không phải chủ sở hữu)
 *   delete → DELETE /api/v1/farms/:id     (403 nếu không phải chủ / 409 nếu có contract)
 *
 * Xử lý lỗi:
 *   - ApiError → thông báo tiếng Việt qua `error` string (component hiển thị Snackbar)
 *   - 401 → interceptor đã xóa authSessionAtom; error chứa thông báo thân thiện
 *   - 403 → thông báo "không có quyền" (owner check)
 *   - 409 → thông báo "hợp đồng đang hoạt động" khi xóa
 *
 * DTO mapping (design.md §4.3, §1.1):
 *   - Backend trả camelCase → farmService.ts map 1-1 → không cần mapper thêm.
 *
 * ZMP SDK:
 *   - Token đã trao đổi ở Phase 1 (login); lưu trong authSessionAtom.
 *   - Interceptor tự đọc accessTokenAtom → không gọi thêm ZMP SDK.
 */

import { useState, useCallback } from 'react';
import * as farmService from '@/services/farmService';
import type { FarmDto, ListFarmsParams, CreateFarmDto, UpdateFarmDto, ListResponse } from '@/services/farmService';
import { ApiError } from '@/api/errors';

export type { FarmDto, ListFarmsParams, CreateFarmDto, UpdateFarmDto };

// ── Error context labels ──────────────────────────────────────────────────────

type ErrorContext = 'load' | 'create' | 'update' | 'delete';

function toVietnameseError(err: unknown, ctx: ErrorContext): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return ctx === 'delete'
          ? 'Không thể xóa vườn này. Bạn không phải chủ sở hữu.'
          : 'Bạn không có quyền thao tác với vườn này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy vườn. Vườn có thể đã bị xóa.';
      case 'CONFLICT':
        return 'Không thể xóa vườn vì đang có hợp đồng hoạt động.';
      case 'INVALID_INPUT':
        return ctx === 'create' || ctx === 'update'
          ? 'Thông tin vườn không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.'
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

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseFarmsReturn {
  farms: FarmDto[];
  total: number;
  /** True trong lần tải danh sách. */
  isLoading: boolean;
  /** True khi đang thực hiện create / update / delete. */
  isMutating: boolean;
  /** Thông báo lỗi tiếng Việt; null khi không có lỗi. */
  error: string | null;
  /** Xóa error để tránh hiện lại snackbar cũ. */
  clearError: () => void;
  /** Tải danh sách vườn theo params. */
  loadFarms: (params?: ListFarmsParams) => Promise<void>;
  /**
   * Tạo vườn mới.
   * @returns FarmDto vừa tạo nếu thành công, null nếu lỗi (error được set).
   */
  createFarm: (body: CreateFarmDto) => Promise<FarmDto | null>;
  /**
   * Cập nhật vườn.
   * @returns FarmDto đã cập nhật nếu thành công, null nếu lỗi.
   */
  updateFarm: (id: string, body: UpdateFarmDto) => Promise<FarmDto | null>;
  /**
   * Xóa vườn.
   * @returns true nếu thành công, false nếu lỗi.
   */
  deleteFarm: (id: string) => Promise<boolean>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFarms(): UseFarmsReturn {
  const [farms, setFarms] = useState<FarmDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── GET /api/v1/farms ────────────────────────────────────────────────────

  const loadFarms = useCallback(async (params?: ListFarmsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: ListResponse<FarmDto> = await farmService.listFarms(params);
      setFarms(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(toVietnameseError(err, 'load'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── POST /api/v1/farms ───────────────────────────────────────────────────

  const createFarm = useCallback(async (body: CreateFarmDto): Promise<FarmDto | null> => {
    setIsMutating(true);
    setError(null);
    try {
      const created = await farmService.createFarm(body);
      setFarms((prev) => [...prev, created]);
      setTotal((prev) => prev + 1);
      return created;
    } catch (err) {
      setError(toVietnameseError(err, 'create'));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // ── PUT /api/v1/farms/:id ────────────────────────────────────────────────

  const updateFarm = useCallback(async (id: string, body: UpdateFarmDto): Promise<FarmDto | null> => {
    setIsMutating(true);
    setError(null);
    try {
      const updated = await farmService.updateFarm(id, body);
      setFarms((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err) {
      setError(toVietnameseError(err, 'update'));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // ── DELETE /api/v1/farms/:id ─────────────────────────────────────────────

  const deleteFarm = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true);
    setError(null);
    try {
      await farmService.deleteFarm(id);
      setFarms((prev) => prev.filter((f) => f.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(toVietnameseError(err, 'delete'));
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    farms,
    total,
    isLoading,
    isMutating,
    error,
    clearError,
    loadFarms,
    createFarm,
    updateFarm,
    deleteFarm,
  };
}
