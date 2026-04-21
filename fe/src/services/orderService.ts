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
 * Server lọc theo JWT: buyer chỉ thấy đơn của mình; trader chỉ thấy đơn của sản phẩm mình.
 * Không cần (và không có) query buyerId/traderId — token quyết định.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export interface OrderDto {
  id: string;
  buyerId: string;
  traderId: string;
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

export interface ListOrdersParams {
  status?: OrderDto['status'] | 'all';
  /** Lọc theo role người gọi (query backend OrderQueryDto) */
  role?: 'buyer' | 'trader';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
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

// ── API ──────────────────────────────────────────────────────────────────────

export async function listOrders(params?: ListOrdersParams): Promise<ListResponse<OrderDto>> {
  const q: Record<string, unknown> = {};
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.role) q.role = params.role;
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<OrderDto>>('/orders', { params: q });
  return data;
}

export async function getOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.get<OrderDto>(`/orders/${id}`);
  return data;
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
