/**
 * Mock Alert Service — Phase 7.1 (FR-F08)
 *
 * Giả lập tầng transport cho alert endpoints — dùng trực tiếp khi BE chưa triển khai.
 * JSON khớp 1-1 với hợp đồng AlertDto trong
 * specs/backend-api-specification/design.md §4.5.
 *
 * Endpoints giả lập:
 *   GET  /api/v1/monitoring/farms/:farmId/alerts   → ListResponse<AlertDto>
 *   POST /api/v1/monitoring/alerts/:id/acknowledge → { success: true }
 */

import { withMockDelay } from './index';
import type { AlertDto, ListResponse, AlertsParams } from '@/services/monitoringService';

export type { AlertDto, ListResponse, AlertsParams };

// ── Mock data store (có thể mutate trong runtime để giả lập acknowledge) ─────

const MOCK_ALERTS_STORE: Record<string, AlertDto[]> = {
  'farm-001': [
    {
      id: 'alert-001',
      farmId: 'farm-001',
      sensorType: 'temperature',
      severity: 'danger',
      threshold: 38,
      value: 40.2,
      suggestedAction:
        'Khẩn cấp: Nhiệt độ cực cao. Bật ngay hệ thống làm mát và che nắng cho cây.',
      acknowledged: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-002',
      farmId: 'farm-001',
      sensorType: 'soil_moisture',
      severity: 'danger',
      threshold: 30,
      value: 24.1,
      suggestedAction:
        'Tưới nước ngay lập tức. Độ ẩm đất xuống mức nguy hiểm, cây có thể bị héo.',
      acknowledged: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-003',
      farmId: 'farm-001',
      sensorType: 'temperature',
      severity: 'warning',
      threshold: 35,
      value: 36.5,
      suggestedAction: 'Bật quạt thông gió và tưới nước mát để hạ nhiệt độ xuống dưới 35°C.',
      acknowledged: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-004',
      farmId: 'farm-001',
      sensorType: 'humidity',
      severity: 'warning',
      threshold: 40,
      value: 38.2,
      suggestedAction:
        'Kiểm tra và điều chỉnh hệ thống tưới phun sương. Độ ẩm không khí thấp hơn ngưỡng an toàn.',
      acknowledged: true,
      acknowledgedBy: 'user-farmer-001',
      acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-005',
      farmId: 'farm-001',
      sensorType: 'light',
      severity: 'warning',
      threshold: 200,
      value: 180,
      suggestedAction:
        'Ánh sáng không đủ cho quang hợp. Bật đèn chiếu sáng bổ sung vào buổi chiều.',
      acknowledged: true,
      acknowledgedBy: 'user-farmer-001',
      acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-006',
      farmId: 'farm-001',
      sensorType: 'soil_moisture',
      severity: 'warning',
      threshold: 35,
      value: 32.8,
      suggestedAction: 'Lên lịch tưới nước trong vòng 2 giờ tới để duy trì độ ẩm đất tối ưu.',
      acknowledged: true,
      acknowledgedBy: 'user-farmer-001',
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'farm-002': [
    {
      id: 'alert-007',
      farmId: 'farm-002',
      sensorType: 'humidity',
      severity: 'warning',
      threshold: 40,
      value: 38.2,
      suggestedAction: 'Kiểm tra hệ thống tưới phun sương của vườn.',
      acknowledged: true,
      acknowledgedBy: 'user-farmer-002',
      acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ── Service functions ──────────────────────────────────────────────────────────

/**
 * Giả lập GET /api/v1/monitoring/farms/:farmId/alerts
 * Hỗ trợ lọc theo status (unacknowledged/acknowledged/all) và severity,
 * cùng phân trang (page, limit).
 * Sắp xếp: mới nhất lên trên.
 */
export async function listAlerts(
  farmId: string,
  params?: AlertsParams,
): Promise<ListResponse<AlertDto>> {
  const all: AlertDto[] = MOCK_ALERTS_STORE[farmId] ?? [];

  let filtered = [...all];

  if (params?.status && params.status !== 'all') {
    if (params.status === 'unacknowledged') {
      filtered = filtered.filter((a) => !a.acknowledged);
    } else {
      filtered = filtered.filter((a) => a.acknowledged);
    }
  }

  if (params?.severity) {
    filtered = filtered.filter((a) => a.severity === params.severity);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return withMockDelay({
    items,
    page,
    limit,
    total: filtered.length,
  });
}

/**
 * Giả lập POST /api/v1/monitoring/alerts/:id/acknowledge
 * Cập nhật trạng thái acknowledged trong mock store.
 */
export async function acknowledgeAlert(alertId: string): Promise<{ success: true }> {
  for (const alerts of Object.values(MOCK_ALERTS_STORE)) {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      break;
    }
  }
  return withMockDelay({ success: true as const });
}

/**
 * Trả về số lượng cảnh báo chưa xác nhận cho một vườn.
 * Dùng cho badge thông báo trên FarmerDashboardScreen.
 */
export function getUnacknowledgedCount(farmId: string): number {
  return (MOCK_ALERTS_STORE[farmId] ?? []).filter((a) => !a.acknowledged).length;
}
