/**
 * standardService — gọi thực tế tới Farm Service (module standards) qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.3):
 *   GET    /api/v1/standards              → ListResponse<StandardDto>
 *   GET    /api/v1/standards/:id          → StandardDto
 *   POST   /api/v1/standards  (trader)    → StandardDto
 *   PUT    /api/v1/standards/:id (trader) → StandardDto
 *   DELETE /api/v1/standards/:id (trader) → { success: true }
 *
 * Tất cả trường JSON đều camelCase theo quy ước backend (design.md §1.1).
 * Bearer token được gắn tự động bởi request interceptor trong interceptors.ts.
 *
 * FR: FR-T10 (thương lái CRUD), FR-F06 (nông dân đọc tiêu chuẩn)
 */

import apiClient from '@/api/client';

// ── DTO types (camelCase — khớp backend design.md §4.3) ───────────────────────

export interface StandardStepDto {
  id: string;
  order: number;
  title: string;
  description: string;
  expectedDurationDays?: number;
  acceptanceCriteria?: string;
}

export interface StandardDto {
  id: string;
  code: string;             // "VIETGAP_2024"
  name: string;
  description: string;
  ownerTraderId?: string;   // null = tiêu chuẩn chung hệ thống
  steps: StandardStepDto[];
  createdAt: string;        // ISO-8601
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListStandardsParams {
  page?: number;
  limit?: number;
  ownerTraderId?: string;
}

export type CreateStandardDto = Pick<StandardDto, 'code' | 'name' | 'description' | 'steps'>;
export type UpdateStandardDto = Partial<CreateStandardDto>;

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/standards
 * Danh sách tiêu chuẩn — mọi role đều đọc được.
 */
export async function listStandards(
  params: ListStandardsParams = {},
): Promise<ListResponse<StandardDto>> {
  const { data } = await apiClient.get<ListResponse<StandardDto>>('/standards', { params });
  return data;
}

/**
 * GET /api/v1/standards/:id
 * Chi tiết tiêu chuẩn kèm các bước.
 */
export async function getStandard(id: string): Promise<StandardDto> {
  const { data } = await apiClient.get<StandardDto>(`/standards/${id}`);
  return data;
}

/**
 * POST /api/v1/standards
 * Tạo tiêu chuẩn mới — chỉ trader (guard server-side, FR-T10).
 */
export async function createStandard(body: CreateStandardDto): Promise<StandardDto> {
  const { data } = await apiClient.post<StandardDto>('/standards', body);
  return data;
}

/**
 * PUT /api/v1/standards/:id
 * Cập nhật tiêu chuẩn — 403 nếu không phải owner (FR-T10).
 */
export async function updateStandard(id: string, body: UpdateStandardDto): Promise<StandardDto> {
  const { data } = await apiClient.put<StandardDto>(`/standards/${id}`, body);
  return data;
}

/**
 * DELETE /api/v1/standards/:id
 * Xóa tiêu chuẩn (soft delete) — 403 nếu không phải owner (FR-T10).
 */
export async function deleteStandard(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.delete<{ success: true }>(`/standards/${id}`);
  return data;
}
