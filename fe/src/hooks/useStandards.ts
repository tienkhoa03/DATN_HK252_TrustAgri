/**
 * useStandards — hook quản lý CRUD thư viện quy trình canh tác chuẩn (Phase 4.2 — Integration).
 *
 * Luồng thật (gọi standardService.ts → Axios → /api/v1/standards*):
 *   load       → GET    /api/v1/standards
 *   getOne     → GET    /api/v1/standards/:id
 *   create     → POST   /api/v1/standards        (trader only — guard server-side + client-side)
 *   update     → PUT    /api/v1/standards/:id    (trader only)
 *   remove     → DELETE /api/v1/standards/:id    (trader only — soft delete)
 *
 * Xử lý lỗi:
 *   - ApiError → thông báo tiếng Việt qua `error` string (component hiển thị Snackbar)
 *   - 401 → interceptor đã xóa authSessionAtom; error thân thiện
 *   - 403 → "không có quyền" — trader guard hoặc không phải owner
 *   - 404 → "không tìm thấy quy trình"
 *   - INVALID_INPUT → "thông tin không hợp lệ"
 *
 * DTO mapping (design.md §4.3, §1.1):
 *   - Backend trả camelCase → standardService.ts map 1-1 → không cần mapper thêm.
 *
 * ZMP SDK:
 *   - Token đã trao đổi ở Phase 1 (login); lưu trong authSessionAtom.
 *   - Interceptor tự đọc accessTokenAtom → không gọi thêm ZMP SDK ở đây.
 *
 * FR: FR-T10 (CRUD thương lái), FR-F06 (đọc tiêu chuẩn — nông dân).
 */

import { useState, useCallback } from 'react';
import * as standardService from '@/services/standardService';
import type {
  StandardDto,
  ListStandardsParams,
  CreateStandardDto,
  UpdateStandardDto,
  ListResponse,
} from '@/services/standardService';
import { ApiError } from '@/api/errors';

export type { StandardDto, ListStandardsParams, CreateStandardDto, UpdateStandardDto };

// ── Vietnamese error messages ─────────────────────────────────────────────────

type ErrorContext = 'load' | 'loadOne' | 'create' | 'update' | 'delete';

function toVietnameseError(err: unknown, ctx: ErrorContext): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return ctx === 'delete'
          ? 'Không thể xóa quy trình này. Bạn không có quyền.'
          : ctx === 'create' || ctx === 'update'
            ? 'Chỉ thương lái mới có thể tạo / chỉnh sửa quy trình canh tác.'
            : 'Bạn không có quyền thực hiện thao tác này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy quy trình. Quy trình có thể đã bị xóa.';
      case 'CONFLICT':
        return 'Không thể xóa quy trình đang được liên kết với hợp đồng hoặc vườn.';
      case 'INVALID_INPUT':
        return ctx === 'create' || ctx === 'update'
          ? 'Thông tin quy trình không hợp lệ. Vui lòng kiểm tra lại mã và tên quy trình.'
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

export interface UseStandardsReturn {
  standards: StandardDto[];
  total: number;
  /** True trong lần tải danh sách. */
  isLoading: boolean;
  /** True khi đang thực hiện create / update / delete. */
  isMutating: boolean;
  /** Thông báo lỗi tiếng Việt; null khi không có lỗi. */
  error: string | null;
  clearError: () => void;
  /** Tải danh sách tiêu chuẩn. */
  loadStandards: (params?: ListStandardsParams) => Promise<void>;
  /** Lấy chi tiết một tiêu chuẩn (kèm steps). */
  getStandard: (id: string) => Promise<StandardDto | null>;
  /**
   * Tạo tiêu chuẩn mới — chỉ trader.
   * @returns StandardDto vừa tạo hoặc null nếu lỗi.
   */
  createStandard: (body: CreateStandardDto) => Promise<StandardDto | null>;
  /**
   * Cập nhật tiêu chuẩn — chỉ trader / owner.
   * @returns StandardDto đã cập nhật hoặc null nếu lỗi.
   */
  updateStandard: (id: string, body: UpdateStandardDto) => Promise<StandardDto | null>;
  /**
   * Xóa tiêu chuẩn (soft delete) — chỉ trader / owner.
   * @returns true nếu thành công, false nếu lỗi.
   */
  removeStandard: (id: string) => Promise<boolean>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useStandards(): UseStandardsReturn {
  const [standards, setStandards] = useState<StandardDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── GET /api/v1/standards ────────────────────────────────────────────────

  const loadStandards = useCallback(async (params?: ListStandardsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: ListResponse<StandardDto> = await standardService.listStandards(params);
      setStandards(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(toVietnameseError(err, 'load'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── GET /api/v1/standards/:id ────────────────────────────────────────────

  const getStandard = useCallback(async (id: string): Promise<StandardDto | null> => {
    try {
      return await standardService.getStandard(id);
    } catch (err) {
      setError(toVietnameseError(err, 'loadOne'));
      return null;
    }
  }, []);

  // ── POST /api/v1/standards ───────────────────────────────────────────────

  const createStandard = useCallback(async (body: CreateStandardDto): Promise<StandardDto | null> => {
    setIsMutating(true);
    setError(null);
    try {
      const created = await standardService.createStandard(body);
      setStandards((prev) => [...prev, created]);
      setTotal((prev) => prev + 1);
      return created;
    } catch (err) {
      setError(toVietnameseError(err, 'create'));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // ── PUT /api/v1/standards/:id ────────────────────────────────────────────

  const updateStandard = useCallback(async (id: string, body: UpdateStandardDto): Promise<StandardDto | null> => {
    setIsMutating(true);
    setError(null);
    try {
      const updated = await standardService.updateStandard(id, body);
      setStandards((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      setError(toVietnameseError(err, 'update'));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // ── DELETE /api/v1/standards/:id (soft delete) ───────────────────────────

  const removeStandard = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true);
    setError(null);
    try {
      await standardService.deleteStandard(id);
      setStandards((prev) => prev.filter((s) => s.id !== id));
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
    standards,
    total,
    isLoading,
    isMutating,
    error,
    clearError,
    loadStandards,
    getStandard,
    createStandard,
    updateStandard,
    removeStandard,
  };
}
