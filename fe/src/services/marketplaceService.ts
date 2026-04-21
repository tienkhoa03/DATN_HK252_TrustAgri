/**
 * marketplaceService — gọi thực tế tới Contract Service (module products)
 * qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.4.1):
 *   GET    /api/v1/products                    → ListResponse<ProductDto>
 *   GET    /api/v1/products/:id               → ProductDto
 *   POST   /api/v1/products (trader)           → ProductDto
 *   PUT    /api/v1/products/:id (trader)       → ProductDto
 *   DELETE /api/v1/products/:id (trader)       → { success: true }
 *
 * Quy ước:
 * - GET danh sách / chi tiết là **public** — không cần Bearer token (FR-G03, FR-U01).
 *   apiClient vẫn gắn token nếu có (không gây lỗi khi token absent).
 * - POST / PUT / DELETE yêu cầu role trader; 403 nếu không đủ quyền.
 * - Tất cả trường JSON đều camelCase (design.md §1.1).
 * - Lỗi HTTP được map sang ApiError bởi response interceptor;
 *   consumer gọi `toMarketplaceViMessage` để lấy chuỗi tiếng Việt cho Snackbar.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO types (camelCase — khớp backend design.md §4.4.1) ─────────────────────

export interface ProductDto {
  id: string;
  traderId: string;
  farmId?: string;
  name: string;
  cropType: string;
  unit: string;           // "kg"
  price: number;
  currency: 'VND';
  images: string[];
  standardCode?: string;  // "VIETGAP_2024" | "GLOBALGAP_2024" | "ORGANIC_2024"
  stockQuantity?: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;      // ISO-8601
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListProductsParams {
  cropType?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  traderId?: string;
  status?: 'active' | 'inactive' | 'all';
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  farmId?: string;
  name: string;
  cropType: string;
  unit: string;
  price: number;
  images?: string[];
  standardCode?: string;
  stockQuantity?: number;
  description?: string;
}

export type UpdateProductDto = Partial<
  Pick<
    ProductDto,
    'name' | 'price' | 'stockQuantity' | 'description' | 'status' | 'images' | 'standardCode'
  >
>;

// ── Helper constants ──────────────────────────────────────────────────────────

export const CROP_LABELS: Record<string, string> = {
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

export const STANDARD_LABELS: Record<string, string> = {
  VIETGAP_2024: 'VietGAP',
  GLOBALGAP_2024: 'GlobalGAP',
  ORGANIC_2024: 'Hữu cơ',
};

export function cropLabel(cropType: string): string {
  return CROP_LABELS[cropType] ?? cropType;
}

export function standardLabel(code?: string): string | undefined {
  if (!code) return undefined;
  return STANDARD_LABELS[code] ?? code;
}

export function cropEmoji(cropType: string): string {
  const map: Record<string, string> = {
    dragon_fruit: '🐉',
    pomelo: '🍊',
    mango: '🥭',
    orange: '🍊',
    longan: '🍇',
    durian: '🌳',
    lychee: '🍒',
    banana: '🍌',
    rambutan: '🍈',
  };
  return map[cropType] ?? '🌾';
}

// ── Vietnamese error message mapper ──────────────────────────────────────────

type MarketplaceContext =
  | 'list'
  | 'detail'
  | 'create'
  | 'update'
  | 'delete';

/**
 * Chuyển ApiError code → thông báo tiếng Việt cho màn marketplace.
 */
export function toMarketplaceViMessage(
  err: unknown,
  context?: MarketplaceContext,
): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này (chỉ dành cho thương lái).';
      case 'NOT_FOUND':
        return context === 'detail'
          ? 'Sản phẩm không tồn tại hoặc đã bị xóa.'
          : 'Không tìm thấy dữ liệu.';
      case 'CONFLICT':
        return 'Xung đột dữ liệu. Vui lòng tải lại trang và thử lại.';
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
      return 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.';
    case 'detail':
      return 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.';
    case 'create':
      return 'Không thể tạo sản phẩm. Vui lòng thử lại.';
    case 'update':
      return 'Không thể cập nhật sản phẩm. Vui lòng thử lại.';
    case 'delete':
      return 'Không thể xóa sản phẩm. Vui lòng thử lại.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/products
 * Public — không yêu cầu auth. Lọc theo cropType, region, priceMin, priceMax, traderId, status.
 * 'all' bị loại trước khi gửi để tránh tham số không hợp lệ.
 */
export async function listProducts(
  params?: ListProductsParams,
): Promise<ListResponse<ProductDto>> {
  const q: Record<string, unknown> = {};
  if (params?.cropType && params.cropType !== 'all') q.cropType = params.cropType;
  if (params?.region && params.region !== 'all') q.region = params.region;
  if (params?.traderId) q.traderId = params.traderId;
  if (params?.priceMin !== undefined) q.priceMin = params.priceMin;
  if (params?.priceMax !== undefined) q.priceMax = params.priceMax;
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.keyword) q.keyword = params.keyword;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<ProductDto>>('/products', {
    params: q,
  });
  return data;
}

/**
 * GET /api/v1/products/:id
 * Public — trả chi tiết sản phẩm kèm tham chiếu vườn.
 */
export async function getProduct(id: string): Promise<ProductDto> {
  const { data } = await apiClient.get<ProductDto>(`/products/${id}`);
  return data;
}

/**
 * POST /api/v1/products
 * Trader only — tạo mặt hàng mới (403 nếu không phải trader).
 */
export async function createProduct(body: CreateProductDto): Promise<ProductDto> {
  const { data } = await apiClient.post<ProductDto>('/products', body);
  return data;
}

/**
 * PUT /api/v1/products/:id
 * Trader only — cập nhật thông tin mặt hàng (403 nếu không phải chủ sở hữu).
 */
export async function updateProduct(
  id: string,
  body: UpdateProductDto,
): Promise<ProductDto> {
  const { data } = await apiClient.put<ProductDto>(`/products/${id}`, body);
  return data;
}

/**
 * DELETE /api/v1/products/:id
 * Trader only — tắt / xóa mặt hàng (soft delete phía server).
 * Backend trả { success: true }.
 */
export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/products/${id}`);
  return data;
}
