/**
 * notificationService — Notification Service qua API Gateway (design.md §4.2).
 *
 *   GET    /api/v1/notifications              → ListResponse<NotificationDto>
 *   POST   /api/v1/notifications/:id/read     → { success: true }
 *   POST   /api/v1/notifications/read-all     → { updated: number }
 *
 * JWT: interceptor đọc accessTokenAtom (Phase 1); không gọi ZMP SDK thêm trong module này.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export interface NotificationDto {
  id: string;
  type: 'alert' | 'contract' | 'connection' | 'system';
  title: string;
  body: string;
  severity?: 'info' | 'warning' | 'danger';
  linkTo?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

type NotifCtx = 'list' | 'read' | 'readAll' | 'badge';

export function toNotificationViMessage(err: unknown, context: NotifCtx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền xem thông báo này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy thông báo.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ thông báo tạm thời không khả dụng. Thử lại sau.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<NotifCtx, string> = {
    list: 'Không thể tải danh sách thông báo.',
    read: 'Không thể cập nhật trạng thái đã đọc.',
    readAll: 'Không thể đánh dấu đã đọc tất cả.',
    badge: 'Không thể tải số thông báo mới.',
  };
  return fallback[context];
}

/** Chuẩn hoá phòng khi proxy đổi tên trường (ưu tiên camelCase như Nest). */
function mapOne(raw: Record<string, unknown>): NotificationDto {
  return {
    id: String(raw.id ?? ''),
    type: raw.type as NotificationDto['type'],
    title: String(raw.title ?? ''),
    body: String(raw.body ?? raw['body'] ?? ''),
    severity: raw.severity as NotificationDto['severity'] | undefined,
    linkTo: (raw.linkTo ?? raw['link_to']) as string | undefined,
    read: Boolean(raw.read ?? raw['read']),
    readAt: (raw.readAt ?? raw['read_at']) as string | undefined,
    createdAt: String(raw.createdAt ?? raw['created_at'] ?? ''),
  };
}

function mapList(data: ListResponse<Record<string, unknown>>): ListResponse<NotificationDto> {
  return {
    items: (data.items ?? []).map((row) => mapOne(row)),
    page: data.page,
    limit: data.limit,
    total: data.total,
  };
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<ListResponse<NotificationDto>> {
  const q: Record<string, unknown> = {};
  if (params.page != null) q.page = params.page;
  if (params.limit != null) q.limit = params.limit;
  if (params.unreadOnly === true) q.unreadOnly = true;

  const { data } = await apiClient.get<ListResponse<Record<string, unknown>>>('/notifications', {
    params: q,
  });
  return mapList(data);
}

export async function markNotificationRead(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.post<{ success: true }>(`/notifications/${encodeURIComponent(id)}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/read-all');
  return data;
}

/** Đếm thông báo chưa đọc (dùng total từ list + unreadOnly). */
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await listNotifications({ page: 1, limit: 1, unreadOnly: true });
  return res.total;
}
