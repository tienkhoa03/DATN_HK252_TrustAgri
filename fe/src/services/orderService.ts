/**
 * orderService — gọi thực tế tới Contract Service (module orders) qua API Gateway.
 *
 * Endpoints (design.md §4.4.3):
 *   GET    /api/v1/orders
 *   GET    /api/v1/orders/:id
 *   POST   /api/v1/orders              (buyer)
 *   POST   /api/v1/orders/:id/accept   (trader)
 *   POST   /api/v1/orders/:id/reject   (trader)
 *   POST   /api/v1/orders/:id/cancel   (buyer)
 *
 * Server lọc theo JWT; thêm query tùy chọn `buyerId=me|uuid`, `includeSummary`, `from`, `to` (Phase 19).
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export interface OrderDto {
  id: string;
  buyerId: string;
  traderId: string;
  buyerDisplayName?: string | null;
  traderDisplayName?: string | null;
  productId: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  deposit?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'contracted' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/** GET /orders|/contracts khi `includeSummary=true` (common.dto.ts) */
export interface BuyerTransactionSummaryDto {
  totalSpent: number;
  completedCount: number;
}

export type ListOrdersResponse = ListResponse<OrderDto> & {
  summary?: BuyerTransactionSummaryDto;
};

export interface ListOrdersParams {
  status?: OrderDto['status'] | 'all';
  /** Lọc theo role người gọi (query backend OrderQueryDto) */
  role?: 'buyer' | 'trader';
  /** `me` = người mua trong JWT (role buyer) */
  buyerId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  includeSummary?: boolean;
}

export interface CreateOrderDto {
  productId: string;
  quantity: number;
  unit: string;
  deposit?: number;
}

// ── UI helpers (DTO chỉ có id, không có tên hiển thị) ─────────────────────────

export function buyerDisplayName(buyerId: string): string {
  return `Người mua #${buyerId.slice(0, 8)}`;
}

export function traderDisplayName(traderId: string): string {
  return `Thương lái #${traderId.slice(0, 8)}`;
}

export function productDisplayName(productId: string): string {
  return `Sản phẩm #${productId.slice(0, 8)}`;
}

export function orderStatusLabel(status: OrderDto['status']): string {
  switch (status) {
    case 'pending':    return 'Chờ xác nhận';
    case 'accepted':   return 'Đã xác nhận';
    case 'rejected':   return 'Đã từ chối';
    case 'cancelled':  return 'Đã hủy';
    case 'contracted': return 'Đã ký hợp đồng';
    case 'completed':  return 'Hoàn tất';
    default:           return status;
  }
}

type OrderCtx = 'list' | 'get' | 'create' | 'accept' | 'reject' | 'cancel';

export function toOrderViMessage(err: unknown, context: OrderCtx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này với đơn hàng.';
      case 'NOT_FOUND':
        return 'Không tìm thấy đơn hàng.';
      case 'CONFLICT':
        return 'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<OrderCtx, string> = {
    list:   'Không thể tải danh sách đơn hàng.',
    get:    'Không thể tải chi tiết đơn hàng.',
    create: 'Không thể tạo đơn hàng.',
    accept: 'Không thể xác nhận đơn hàng.',
    reject: 'Không thể từ chối đơn hàng.',
    cancel: 'Không thể hủy đơn hàng.',
  };
  return fallback[context];
}

function normalizeOrder(raw: unknown): OrderDto {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    buyerId: String(r.buyerId ?? r.buyer_id ?? ''),
    traderId: String(r.traderId ?? r.trader_id ?? ''),
    productId: String(r.productId ?? r.product_id ?? ''),
    quantity: Number(r.quantity ?? 0),
    unit: String(r.unit ?? ''),
    totalPrice: Number(r.totalPrice ?? r.total_price ?? 0),
    deposit:
      r.deposit != null && r.deposit !== ''
        ? Number(r.deposit)
        : undefined,
    status: r.status as OrderDto['status'],
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
  };
}

function normalizeSummary(raw: unknown): BuyerTransactionSummaryDto | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const s = raw as Record<string, unknown>;
  return {
    totalSpent: Number(s.totalSpent ?? s.total_spent ?? 0),
    completedCount: Number(s.completedCount ?? s.completed_count ?? 0),
  };
}

function normalizeListOrdersResponse(raw: unknown): ListOrdersResponse {
  const d = raw as Record<string, unknown>;
  const itemsRaw = d.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeOrder) : [];
  return {
    items,
    page: Number(d.page ?? 1),
    limit: Number(d.limit ?? 20),
    total: Number(d.total ?? 0),
    ...(d.summary != null ? { summary: normalizeSummary(d.summary) } : {}),
  };
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function listOrders(params?: ListOrdersParams): Promise<ListOrdersResponse> {
  const q: Record<string, unknown> = {};
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.role) q.role = params.role;
  if (params?.buyerId) q.buyerId = params.buyerId;
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;
  if (params?.includeSummary === true) q.includeSummary = true;

  const { data } = await apiClient.get<unknown>('/orders', { params: q });
  return normalizeListOrdersResponse(data);
}

export async function getOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.get<unknown>(`/orders/${id}`);
  return normalizeOrder(data);
}

export async function createOrder(body: CreateOrderDto): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>('/orders', body);
  return data;
}

export async function acceptOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>(`/orders/${id}/accept`);
  return data;
}

export async function rejectOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>(`/orders/${id}/reject`);
  return data;
}

export async function cancelOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>(`/orders/${id}/cancel`);
  return data;
}
