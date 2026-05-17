/**
 * deviceService — IoT Device CRUD qua API Gateway (Phase B1).
 *
 * Endpoints (monitoring-service):
 *   GET    /api/v1/monitoring/farms/:farmId/devices  → IotDeviceDto[]
 *   POST   /api/v1/monitoring/farms/:farmId/devices  → IotDeviceDto
 *   PATCH  /api/v1/monitoring/devices/:id            → IotDeviceDto
 *   DELETE /api/v1/monitoring/devices/:id            → { success: true }
 *
 * JWT: interceptor gắn Authorization tự động.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export type DeviceStatus = 'online' | 'offline';

export interface IotDeviceDto {
  id: string;
  farmId: string;
  farmName?: string | null;
  name: string;
  status: DeviceStatus;
  batteryLevel?: number;
  sensorTypes: string[];
  firmwareVersion?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIotDeviceBody {
  name: string;
  sensorTypes: string[];
  batteryLevel?: number;
  firmwareVersion?: string;
  status?: DeviceStatus;
}

export type UpdateIotDeviceBody = Partial<CreateIotDeviceBody>;

// ── Service functions ────────────────────────────────────────────────────────

export async function listDevices(farmId: string): Promise<IotDeviceDto[]> {
  const { data } = await apiClient.get<IotDeviceDto[]>(
    `/monitoring/farms/${encodeURIComponent(farmId)}/devices`,
  );
  return data;
}

export async function createDevice(
  farmId: string,
  body: CreateIotDeviceBody,
): Promise<IotDeviceDto> {
  const { data } = await apiClient.post<IotDeviceDto>(
    `/monitoring/farms/${encodeURIComponent(farmId)}/devices`,
    body,
  );
  return data;
}

export async function updateDevice(
  id: string,
  body: UpdateIotDeviceBody,
): Promise<IotDeviceDto> {
  const { data } = await apiClient.patch<IotDeviceDto>(
    `/monitoring/devices/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function deleteDevice(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.delete<{ success: true }>(
    `/monitoring/devices/${encodeURIComponent(id)}`,
  );
  return data;
}

// ── Vietnamese error mapping ─────────────────────────────────────────────────

type DeviceCtx = 'list' | 'create' | 'update' | 'delete';

export function toDeviceViMessage(err: unknown, context: DeviceCtx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thao tác trên thiết bị này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy thiết bị.';
      case 'CONFLICT':
        return err.message || 'Thiết bị đã tồn tại hoặc đang được sử dụng.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ giám sát tạm thời không khả dụng. Thử lại sau.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<DeviceCtx, string> = {
    list: 'Không thể tải danh sách thiết bị IoT.',
    create: 'Không thể thêm thiết bị mới.',
    update: 'Không thể cập nhật thiết bị.',
    delete: 'Không thể xóa thiết bị.',
  };
  return fallback[context];
}
