/**
 * buyingRequestService — gọi thực tế tới Contract Service (module buying-requests)
 * qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.4.2):
 *   GET    /api/v1/buying-requests                    → ListResponse<BuyingRequestDto>
 *   GET    /api/v1/buying-requests/:id               → BuyingRequestDto
 *   POST   /api/v1/buying-requests (buyer)            → BuyingRequestDto
 *   PUT    /api/v1/buying-requests/:id (buyer owner)  → BuyingRequestDto
 *   DELETE /api/v1/buying-requests/:id (buyer owner)  → { success: true }  (soft delete)
 *
 * Quy ước:
 * - Tất cả trường JSON đều camelCase (design.md §1.1).
 * - Bearer token được gắn tự động bởi request interceptor (interceptors.ts).
 * - GET danh sách public theo role: Buyer thấy của mình (buyerId = me),
 *   Trader thấy tất cả status = 'open' (FR-T04).
 * - Lỗi HTTP được map sang ApiError bởi response interceptor;
 *   consumer gọi `toBuyingRequestViMessage` để lấy chuỗi tiếng Việt cho Snackbar.
 *
 * Phase 10.2 — tích hợp thật thay thế mockBuyingRequestService.
 * Liên kết Phase 11: khi trader gọi POST /api/v1/proposals, truyền buyingRequestId
 * lấy từ BuyingRequestDto.id của màn này.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO types (camelCase — khớp backend design.md §4.4.2) ─────────────────────

export interface BuyingRequestDto {
  id: string;
  buyerId: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityStandardCode?: string;
  expectedPrice?: number;
  depositOffered?: number;
  deliveryDate: string;   // ISO-8601
  status: 'open' | 'matched' | 'closed';
  createdAt: string;      // ISO-8601
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListBuyingRequestsParams {
  /** Lọc theo buyer — truyền 'me' để lấy của bản thân (buyer role). */
  buyerId?: string;
  /** Lọc trạng thái. Trader thường dùng 'open'; Buyer dùng 'all' để xem đủ. */
  status?: 'open' | 'matched' | 'closed' | 'all';
  cropType?: string;
  page?: number;
  limit?: number;
}

export interface CreateBuyingRequestDto {
  cropType: string;
  quantity: number;
  unit: string;
  qualityStandardCode?: string;
  expectedPrice?: number;
  depositOffered?: number;
  deliveryDate: string;   // ISO-8601
}

export type UpdateBuyingRequestDto = Partial<
  Pick<
    BuyingRequestDto,
    | 'quantity'
    | 'unit'
    | 'qualityStandardCode'
    | 'expectedPrice'
    | 'depositOffered'
    | 'deliveryDate'
  >
>;

// ── Display helpers (UI-only, không thuộc hợp đồng backend) ───────────────────

export const CROP_LABELS_BR: Record<string, string> = {
  dragon_fruit: 'Thanh long',
  pomelo: 'Bưởi',
  mango: 'Xoài',
  orange: 'Cam',
  longan: 'Nhãn',
  durian: 'Sầu riêng',
  lychee: 'Vải',
  banana: 'Chuối',
  rambutan: 'Chôm chôm',
};

export const STANDARD_LABELS_BR: Record<string, string> = {
  VIETGAP_2024: 'VietGAP',
  GLOBALGAP_2024: 'GlobalGAP',
  ORGANIC_2024: 'Hữu cơ',
  OCOP_2024: 'OCOP',
};

export function cropLabelBR(cropType: string): string {
  return CROP_LABELS_BR[cropType] ?? cropType;
}

export function standardLabelBR(code?: string): string | undefined {
  if (!code) return undefined;
  return STANDARD_LABELS_BR[code] ?? code;
}

/**
 * Hiển thị tên người mua từ buyerId.
 * BuyingRequestDto chỉ trả buyerId; tên đầy đủ cần một lần gọi GET /auth/users/:id
 * (ngoài phạm vi Phase 10 — sẽ làm ở Phase 11 khi proposal cần thông tin buyer).
 */
export function buyerDisplayName(buyerId: string): string {
  return `Người mua #${buyerId.slice(-6)}`;
}

// ── Vietnamese error message mapper ──────────────────────────────────────────

type BRContext = 'list' | 'detail' | 'create' | 'update' | 'delete';

/**
 * Chuyển ApiError code → thông báo tiếng Việt cho màn buying request.
 */
export function toBuyingRequestViMessage(
  err: unknown,
  context?: BRContext,
): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 'NOT_FOUND':
        return context === 'detail'
          ? 'Yêu cầu mua không tồn tại hoặc đã bị đóng.'
          : 'Không tìm thấy dữ liệu.';
      case 'CONFLICT':
        return 'Yêu cầu mua này đã được cập nhật bởi bên khác. Vui lòng tải lại.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào.';
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
    case 'list':
      return 'Không thể tải danh sách nhu cầu mua. Vui lòng thử lại.';
    case 'detail':
      return 'Không thể tải thông tin yêu cầu mua. Vui lòng thử lại.';
    case 'create':
      return 'Không thể đăng yêu cầu mua. Vui lòng thử lại.';
    case 'update':
      return 'Không thể cập nhật yêu cầu mua. Vui lòng thử lại.';
    case 'delete':
      return 'Không thể hủy yêu cầu mua. Vui lòng thử lại.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/buying-requests
 *
 * - Buyer: truyền `buyerId: 'me'` để lấy danh sách của bản thân.
 * - Trader: truyền `status: 'open'` để xem nhu cầu công khai.
 * - Không truyền gì: server trả theo role của token hiện tại.
 */
export async function listBuyingRequests(
  params?: ListBuyingRequestsParams,
): Promise<ListResponse<BuyingRequestDto>> {
  const q: Record<string, unknown> = {};
  if (params?.buyerId) q.buyerId = params.buyerId;
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.cropType && params.cropType !== 'all') q.cropType = params.cropType;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<BuyingRequestDto>>(
    '/buying-requests',
    { params: q },
  );
  return data;
}

/**
 * GET /api/v1/buying-requests/:id
 * Trả về chi tiết một yêu cầu mua.
 */
export async function getBuyingRequest(id: string): Promise<BuyingRequestDto> {
  const { data } = await apiClient.get<BuyingRequestDto>(`/buying-requests/${id}`);
  return data;
}

/**
 * POST /api/v1/buying-requests
 * Buyer only — tạo yêu cầu mua mới (token xác định buyerId phía server).
 * Server trả về BuyingRequestDto với status = 'open'.
 */
export async function createBuyingRequest(
  body: CreateBuyingRequestDto,
): Promise<BuyingRequestDto> {
  const { data } = await apiClient.post<BuyingRequestDto>('/buying-requests', body);
  return data;
}

/**
 * PUT /api/v1/buying-requests/:id
 * Buyer owner only — cập nhật yêu cầu (403 nếu không phải chủ).
 * Chỉ hoạt động khi status = 'open'; server trả 409 nếu đã matched/closed.
 */
export async function updateBuyingRequest(
  id: string,
  body: UpdateBuyingRequestDto,
): Promise<BuyingRequestDto> {
  const { data } = await apiClient.put<BuyingRequestDto>(`/buying-requests/${id}`, body);
  return data;
}

/**
 * DELETE /api/v1/buying-requests/:id
 * Buyer owner only — hủy yêu cầu (soft delete phía server → status 'closed').
 * Server trả { success: true }.
 */
export async function deleteBuyingRequest(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/buying-requests/${id}`,
  );
  return data;
}
