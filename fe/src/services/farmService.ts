/**
 * farmService — gọi thực tế tới Farm Service qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.3):
 *   GET    /api/v1/farms                    → ListResponse<FarmDto>
 *   GET    /api/v1/farms/:id               → FarmDto
 *   POST   /api/v1/farms                   → FarmDto
 *   PUT    /api/v1/farms/:id               → FarmDto
 *   DELETE /api/v1/farms/:id               → { success: true }
 *
 * Tất cả trường JSON đều camelCase theo quy ước backend (design.md §1.1).
 * Bearer token được gắn tự động bởi request interceptor trong interceptors.ts.
 *
 * Error: interceptor map lỗi HTTP sang ApiError; consumer dùng parseAxiosError
 * hoặc bắt trực tiếp ApiError để hiển thị Snackbar tiếng Việt.
 */

import apiClient from '@/api/client';

// ── DTO types (camelCase — khớp backend design.md §4.3) ───────────────────────

export interface FarmLocation {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

export interface FarmDto {
  id: string;
  ownerId: string;          // userId nông dân
  name: string;             // ví dụ: "Farm Lab Đông A"
  location: FarmLocation;
  area: number;             // m²
  cropType: string;         // ví dụ: "dragon_fruit"
  standardId?: string;      // liên kết tiêu chuẩn (FR-F06)
  traceabilityCode?: string; // FR-G01: mã QR truy xuất công khai (TR-<12chars>)
  createdAt: string;        // ISO-8601
  updatedAt: string;        // ISO-8601
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListFarmsParams {
  region?: string;
  cropType?: string;
  ownerId?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface ListFarmsRequestOptions {
  accessToken?: string;
}

export type CreateFarmDto = Pick<FarmDto, 'name' | 'location' | 'area' | 'cropType' | 'standardId'>;
export type UpdateFarmDto = Partial<CreateFarmDto>;

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/farms
 * Danh sách vườn với lọc region / cropType / ownerId và phân trang.
 * 'all' được lọc ra trước khi gửi để tránh gửi tham số không hợp lệ lên server.
 */
export async function listFarms(
  params: ListFarmsParams = {},
  options: ListFarmsRequestOptions = {},
): Promise<ListResponse<FarmDto>> {
  // Lọc bỏ giá trị 'all' — chỉ có ý nghĩa với UI, không phải API
  const cleanParams: Record<string, unknown> = {};
  if (params.ownerId) cleanParams.ownerId = params.ownerId;
  if (params.keyword && params.keyword.trim()) cleanParams.keyword = params.keyword.trim();
  if (params.cropType && params.cropType !== 'all') cleanParams.cropType = params.cropType;
  if (params.region && params.region !== 'all') cleanParams.region = params.region;
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<FarmDto>>('/farms', {
    params: cleanParams,
    headers: options.accessToken
      ? { Authorization: `Bearer ${options.accessToken}` }
      : undefined,
  });
  return data;
}

/**
 * GET /api/v1/farms/:id
 */
export async function getFarm(id: string): Promise<FarmDto> {
  const { data } = await apiClient.get<FarmDto>(`/farms/${id}`);
  return data;
}

/**
 * POST /api/v1/farms
 * Tạo Farm Lab mới — chỉ nông dân được phép (guard server-side).
 */
export async function createFarm(body: CreateFarmDto): Promise<FarmDto> {
  const { data } = await apiClient.post<FarmDto>('/farms', body);
  return data;
}

/**
 * PUT /api/v1/farms/:id
 * Cập nhật vườn — 403 nếu không phải chủ sở hữu (FR-F01).
 */
export async function updateFarm(id: string, body: UpdateFarmDto): Promise<FarmDto> {
  const { data } = await apiClient.put<FarmDto>(`/farms/${id}`, body);
  return data;
}

/**
 * DELETE /api/v1/farms/:id
 * Xóa vườn — 403 nếu không phải chủ / 409 nếu có hợp đồng active (FR-F01).
 */
export async function deleteFarm(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.delete<{ success: true }>(`/farms/${id}`);
  return data;
}
