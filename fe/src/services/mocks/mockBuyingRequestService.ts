/**
 * Mock Buying Request Service — Phase 10.1 (FR-U02, FR-T04)
 *
 * Giả lập tầng transport cho BuyingRequest endpoints — dùng khi BE chưa triển khai.
 * JSON khớp 1-1 với hợp đồng BuyingRequestDto trong
 * specs/backend-api-specification/design.md §4.4.2.
 *
 * Endpoints giả lập:
 *   GET    /api/v1/buying-requests                → ListResponse<BuyingRequestDto>
 *   GET    /api/v1/buying-requests/:id            → BuyingRequestDto
 *   POST   /api/v1/buying-requests (buyer)        → BuyingRequestDto
 *   PUT    /api/v1/buying-requests/:id (buyer)    → BuyingRequestDto
 *   DELETE /api/v1/buying-requests/:id (buyer)    → { success: true }  (soft delete → 'closed')
 */

import { withMockDelay } from './index';

// ── DTOs (camelCase, khớp hợp đồng backend §4.4.2) ───────────────────────────

export interface BuyingRequestDto {
  id: string;
  buyerId: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityStandardCode?: string;
  expectedPrice?: number;
  depositOffered?: number;
  deliveryDate: string;   // ISO-8601 date string
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
  buyerId?: string;
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
  deliveryDate: string;
}

export type UpdateBuyingRequestDto = Partial<
  Pick<BuyingRequestDto, 'quantity' | 'unit' | 'qualityStandardCode' | 'expectedPrice' | 'depositOffered' | 'deliveryDate'>
>;

// ── Mock buyer display names (lookup helper, không thuộc hợp đồng backend) ────
// Trong production, BE sẽ trả buyerDisplayName qua join với Auth Service.

export const MOCK_BUYER_PROFILES: Record<string, string> = {
  'buyer-001': 'Nhà hàng Sài Gòn',
  'buyer-002': 'Siêu thị Organic Green',
  'buyer-003': 'Cửa hàng Trái cây Tươi',
  'buyer-004': 'Công ty XNK Vina Foods',
  'buyer-me': 'Tôi',
};

/** Trả về tên hiển thị cho buyer từ buyerId (chỉ dùng trong mock). */
export function buyerDisplayName(buyerId: string): string {
  return MOCK_BUYER_PROFILES[buyerId] ?? `Người mua #${buyerId.slice(-4)}`;
}

// ── Crop label helpers ────────────────────────────────────────────────────────

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

// ── Mock data store (có thể mutate khi create/update/delete) ──────────────────

let MOCK_BUYING_REQUESTS: BuyingRequestDto[] = [
  {
    id: 'br-001',
    buyerId: 'buyer-001',
    cropType: 'durian',
    quantity: 200,
    unit: 'kg',
    qualityStandardCode: 'VIETGAP_2024',
    expectedPrice: 115000,
    depositOffered: 5000000,
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'br-002',
    buyerId: 'buyer-002',
    cropType: 'pomelo',
    quantity: 500,
    unit: 'kg',
    qualityStandardCode: 'ORGANIC_2024',
    expectedPrice: 45000,
    deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'br-003',
    buyerId: 'buyer-003',
    cropType: 'mango',
    quantity: 300,
    unit: 'kg',
    qualityStandardCode: 'VIETGAP_2024',
    expectedPrice: 55000,
    depositOffered: 3000000,
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'br-004',
    buyerId: 'buyer-me',
    cropType: 'orange',
    quantity: 100,
    unit: 'kg',
    qualityStandardCode: 'VIETGAP_2024',
    expectedPrice: 32000,
    deliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'matched',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'br-005',
    buyerId: 'buyer-004',
    cropType: 'lychee',
    quantity: 1000,
    unit: 'kg',
    qualityStandardCode: 'GLOBALGAP_2024',
    expectedPrice: 50000,
    depositOffered: 10000000,
    deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'br-006',
    buyerId: 'buyer-me',
    cropType: 'banana',
    quantity: 500,
    unit: 'kg',
    deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'closed',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Giả lập GET /api/v1/buying-requests
 * Trader thấy tất cả `open`; Buyer thấy của mình (lọc theo buyerId).
 */
export async function listBuyingRequests(
  params?: ListBuyingRequestsParams,
): Promise<ListResponse<BuyingRequestDto>> {
  let results = [...MOCK_BUYING_REQUESTS];

  const statusFilter = params?.status ?? 'all';
  if (statusFilter !== 'all') {
    results = results.filter((r) => r.status === statusFilter);
  }

  if (params?.buyerId) {
    results = results.filter((r) => r.buyerId === params.buyerId);
  }

  if (params?.cropType && params.cropType !== 'all') {
    results = results.filter((r) => r.cropType === params.cropType);
  }

  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const items = results.slice((page - 1) * limit, page * limit);

  return withMockDelay({ items, page, limit, total: results.length });
}

/**
 * Giả lập GET /api/v1/buying-requests/:id
 * Trả về chi tiết một yêu cầu mua.
 */
export async function getBuyingRequest(id: string): Promise<BuyingRequestDto> {
  const request = MOCK_BUYING_REQUESTS.find((r) => r.id === id);
  if (!request) {
    return withMockDelay<BuyingRequestDto>(() => {
      throw new Error('Yêu cầu mua không tồn tại.');
    });
  }
  return withMockDelay({ ...request });
}

/**
 * Giả lập POST /api/v1/buying-requests (buyer only)
 * Tạo yêu cầu mua mới, mặc định status = 'open'.
 */
export async function createBuyingRequest(
  buyerId: string,
  body: CreateBuyingRequestDto,
): Promise<BuyingRequestDto> {
  const newRequest: BuyingRequestDto = {
    id: `br-${Date.now()}`,
    buyerId,
    cropType: body.cropType,
    quantity: body.quantity,
    unit: body.unit,
    qualityStandardCode: body.qualityStandardCode,
    expectedPrice: body.expectedPrice,
    depositOffered: body.depositOffered,
    deliveryDate: body.deliveryDate,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  MOCK_BUYING_REQUESTS = [newRequest, ...MOCK_BUYING_REQUESTS];
  return withMockDelay({ ...newRequest });
}

/**
 * Giả lập PUT /api/v1/buying-requests/:id (buyer owner only)
 * Cập nhật yêu cầu (chỉ khi status = 'open').
 */
export async function updateBuyingRequest(
  id: string,
  body: UpdateBuyingRequestDto,
): Promise<BuyingRequestDto> {
  const index = MOCK_BUYING_REQUESTS.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Yêu cầu mua không tồn tại.');
  if (MOCK_BUYING_REQUESTS[index].status !== 'open') {
    throw new Error('Chỉ có thể chỉnh sửa yêu cầu đang mở.');
  }
  MOCK_BUYING_REQUESTS[index] = { ...MOCK_BUYING_REQUESTS[index], ...body };
  return withMockDelay({ ...MOCK_BUYING_REQUESTS[index] });
}

/**
 * Giả lập DELETE /api/v1/buying-requests/:id (buyer owner only)
 * Soft delete — chuyển status sang 'closed'.
 */
export async function deleteBuyingRequest(id: string): Promise<{ success: boolean }> {
  const request = MOCK_BUYING_REQUESTS.find((r) => r.id === id);
  if (!request) throw new Error('Yêu cầu mua không tồn tại.');
  request.status = 'closed';
  return withMockDelay({ success: true });
}
