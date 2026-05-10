/**
 * traderReviewService — quản lý đánh giá thương lái và điểm tin cậy.
 *
 * Endpoints (specs/backend-api-specification/design.md §trust-score):
 *   GET    /api/v1/traders/:traderId/reviews       → ListResponse<TraderReviewDto>
 *   GET    /api/v1/traders/:traderId/trust-score   → TrustScoreDto
 *   POST   /api/v1/traders/:traderId/reviews       → TraderReviewDto
 *   PATCH  /api/v1/reviews/:id                     → TraderReviewDto
 *   DELETE /api/v1/reviews/:id                     → void
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO types ─────────────────────────────────────────────────────────────────

export interface TraderReviewDto {
  id: string;
  traderId: string;
  buyerId: string;
  buyerDisplayName?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustScoreDto {
  traderId: string;
  average: number | null;
  count: number;
}

export interface CreateTraderReviewBody {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface UpdateTraderReviewBody {
  rating?: number;
  comment?: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listTraderReviews(
  traderId: string,
  page?: number,
  limit?: number,
): Promise<ListResponse<TraderReviewDto>> {
  const params: Record<string, unknown> = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  const { data } = await apiClient.get<ListResponse<TraderReviewDto>>(
    `/traders/${traderId}/reviews`,
    { params },
  );
  return data;
}

export async function getTrustScore(traderId: string): Promise<TrustScoreDto> {
  const { data } = await apiClient.get<TrustScoreDto>(
    `/traders/${traderId}/trust-score`,
  );
  return data;
}

export async function createTraderReview(
  traderId: string,
  body: CreateTraderReviewBody,
): Promise<TraderReviewDto> {
  const { data } = await apiClient.post<TraderReviewDto>(
    `/traders/${traderId}/reviews`,
    body,
  );
  return data;
}

export async function updateTraderReview(
  reviewId: string,
  body: UpdateTraderReviewBody,
): Promise<TraderReviewDto> {
  const { data } = await apiClient.patch<TraderReviewDto>(
    `/reviews/${reviewId}`,
    body,
  );
  return data;
}

export async function deleteTraderReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`);
}

// ── Vietnamese error message mapper ──────────────────────────────────────────

export function toReviewViMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy đánh giá hoặc thương lái.';
      case 'CONFLICT':
        return 'Bạn đã đánh giá đơn hàng này rồi.';
      case 'INVALID_INPUT':
        return 'Dữ liệu đánh giá không hợp lệ. Vui lòng kiểm tra lại.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      default:
        return err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}
