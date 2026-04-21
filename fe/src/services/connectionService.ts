/**
 * connectionService — gọi thực tế tới Contract Service (module connections)
 * qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.4.6):
 *   GET  /api/v1/traders/search              → ListResponse<TraderSearchResultDto>
 *   GET  /api/v1/farmers/search              → ListResponse<FarmerSearchResultDto>
 *   GET  /api/v1/connections                 → ListResponse<ConnectionDto>
 *   POST /api/v1/connections                 → ConnectionDto
 *   POST /api/v1/connections/:id/accept      → ConnectionDto
 *   POST /api/v1/connections/:id/reject      → ConnectionDto
 *
 * Quy ước:
 * - Tất cả trường JSON đều camelCase (design.md §1.1).
 * - Bearer token được gắn tự động bởi request interceptor.
 * - Lỗi HTTP được map sang ApiError bởi response interceptor;
 *   consumer dùng `toConnectionViMessage` để hiển thị Snackbar tiếng Việt.
 *
 * Ghi chú Phase 8.2:
 * - Push notification khi có yêu cầu kết nối mới được liên kết Phase 15
 *   (NotificationService + WebSocket). Hiện tại UI tự polling khi mở màn.
 * - `counterpartName` không có trong hợp đồng ConnectionDto backend;
 *   tên hiển thị được tra từ search result hoặc để placeholder.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO types (camelCase — khớp backend design.md §4.4.6) ─────────────────────

export interface ConnectionDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromRole: 'farmer' | 'trader';
  toRole: 'farmer' | 'trader';
  farmId?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

/**
 * Kết quả tìm thương lái — GET /api/v1/traders/search
 * Server trả danh sách trader kèm trạng thái kết nối hiện tại với user đang đăng nhập.
 * connectionStatus được tính server-side dựa vào token.
 */
export interface TraderSearchResultDto {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  traderProfile: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  };
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  connectionId?: string;
}

/**
 * Kết quả tìm nông dân — GET /api/v1/farmers/search
 * Server trả danh sách farmer kèm farm summary và trạng thái kết nối.
 */
export interface FarmerSearchResultDto {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  farmerProfile: {
    region: string;
    experienceYears: number;
  };
  farms: Array<{ id: string; name: string; cropType: string; area: number }>;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  connectionId?: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SearchTradersParams {
  keyword?: string;
  region?: string;
  page?: number;
  limit?: number;
}

export interface SearchFarmersParams {
  keyword?: string;
  region?: string;
  cropType?: string;
  page?: number;
  limit?: number;
}

export interface ListConnectionsParams {
  /** Lọc theo hướng: incoming (đến), outgoing (đi), all */
  role?: 'incoming' | 'outgoing' | 'all';
  /** Lọc theo trạng thái */
  status?: 'pending' | 'accepted' | 'rejected' | 'all';
  page?: number;
  limit?: number;
}

export interface CreateConnectionDto {
  /** userId của người nhận yêu cầu kết nối */
  toUserId: string;
  /** Vườn liên quan (tùy chọn) */
  farmId?: string;
  /** Tin nhắn kèm yêu cầu (tùy chọn) */
  message?: string;
}

// ── Vietnamese error messages ──────────────────────────────────────────────────

/**
 * Map ApiError code → thông báo tiếng Việt thân thiện cho màn kết nối.
 */
export function toConnectionViMessage(err: unknown, context?: 'search' | 'list' | 'create' | 'respond'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 'NOT_FOUND':
        return context === 'respond'
          ? 'Yêu cầu kết nối không tồn tại hoặc đã được xử lý.'
          : 'Không tìm thấy dữ liệu.';
      case 'CONFLICT':
        return context === 'create'
          ? 'Đã tồn tại yêu cầu kết nối với đối tác này.'
          : 'Xung đột trạng thái. Vui lòng tải lại trang.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        break;
    }
  }
  switch (context) {
    case 'search':
      return 'Không thể tìm kiếm. Vui lòng thử lại.';
    case 'list':
      return 'Không thể tải danh sách kết nối. Vui lòng thử lại.';
    case 'create':
      return 'Không thể gửi yêu cầu kết nối. Vui lòng thử lại.';
    case 'respond':
      return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/traders/search
 * Nông dân tìm kiếm thương lái uy tín để gửi yêu cầu kết nối (FR-F02).
 * Server tự xác định userId người gọi từ Bearer token.
 */
export async function searchTraders(
  params?: SearchTradersParams,
): Promise<ListResponse<TraderSearchResultDto>> {
  const cleanParams: Record<string, unknown> = {};
  if (params?.keyword) cleanParams.keyword = params.keyword;
  if (params?.region && params.region !== 'all') cleanParams.region = params.region;
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<TraderSearchResultDto>>(
    '/traders/search',
    { params: cleanParams },
  );
  return data;
}

/**
 * GET /api/v1/farmers/search
 * Thương lái tìm nông dân cung cấp nguồn hàng (FR-T07).
 * Server tự xác định userId người gọi từ Bearer token.
 */
export async function searchFarmers(
  params?: SearchFarmersParams,
): Promise<ListResponse<FarmerSearchResultDto>> {
  const cleanParams: Record<string, unknown> = {};
  if (params?.keyword) cleanParams.keyword = params.keyword;
  if (params?.region && params.region !== 'all') cleanParams.region = params.region;
  if (params?.cropType && params.cropType !== 'all') cleanParams.cropType = params.cropType;
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<FarmerSearchResultDto>>(
    '/farmers/search',
    { params: cleanParams },
  );
  return data;
}

/**
 * GET /api/v1/connections
 * Danh sách kết nối của user đang đăng nhập, lọc theo role/status (FR-F03, FR-T08).
 * Server tự xác định userId người gọi từ Bearer token.
 */
export async function listConnections(
  params?: ListConnectionsParams,
): Promise<ListResponse<ConnectionDto>> {
  const cleanParams: Record<string, unknown> = {};
  if (params?.role && params.role !== 'all') cleanParams.role = params.role;
  if (params?.status && params.status !== 'all') cleanParams.status = params.status;
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<ConnectionDto>>(
    '/connections',
    { params: cleanParams },
  );
  return data;
}

/**
 * POST /api/v1/connections
 * Tạo yêu cầu kết nối mới (FR-F02, FR-T07).
 * Server tự xác định fromUserId và fromRole từ Bearer token.
 */
export async function createConnection(
  body: CreateConnectionDto,
): Promise<ConnectionDto> {
  const { data } = await apiClient.post<ConnectionDto>('/connections', body);
  return data;
}

/**
 * POST /api/v1/connections/:id/accept
 * Chấp nhận yêu cầu kết nối (FR-F03, FR-T08).
 */
export async function acceptConnection(connectionId: string): Promise<ConnectionDto> {
  const { data } = await apiClient.post<ConnectionDto>(
    `/connections/${connectionId}/accept`,
    {},
  );
  return data;
}

/**
 * POST /api/v1/connections/:id/reject
 * Từ chối yêu cầu kết nối (FR-F03, FR-T08).
 */
export async function rejectConnection(connectionId: string): Promise<ConnectionDto> {
  const { data } = await apiClient.post<ConnectionDto>(
    `/connections/${connectionId}/reject`,
    {},
  );
  return data;
}
