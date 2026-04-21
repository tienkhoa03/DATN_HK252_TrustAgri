/**
 * Mock Monitoring Service — Phase 6.1 (FR-F07, FR-T11, FR-U05)
 *
 * Giả lập Monitoring Service (dùng thủ công / test; không gắn VITE_USE_MOCK).
 * Types import từ monitoringService.ts (nguồn sự thật duy nhất về hợp đồng DTO).
 *
 * Mỗi hàm trả Promise với độ trễ ~1 giây qua withMockDelay,
 * JSON khớp 1-1 với hợp đồng SensorReadingDto / AlertDto trong
 * specs/backend-api-specification/design.md §4.5.
 *
 * isImputed: true  = giá trị được ước tính bởi mô hình GAIN (không có dữ liệu thực từ cảm biến)
 * isImputed: false = giá trị thực đo từ cảm biến vật lý
 */

import { withMockDelay } from './index';
import type {
  SensorReadingDto,
  SensorType,
  AlertDto,
  ListResponse,
  HistoryParams,
  AlertsParams,
} from '@/services/monitoringService';

// Re-export types for consumers
export type { SensorReadingDto, SensorType, AlertDto, ListResponse, HistoryParams, AlertsParams };

// ── Helpers ───────────────────────────────────────────────────────────────────

const SENSOR_UNITS: Record<SensorType, string> = {
  temperature: '°C',
  humidity: '%',
  light: 'lux',
  soil_moisture: '%',
};

/**
 * Tạo chuỗi thời gian giả lập cho một loại cảm biến.
 * Mỗi điểm cách nhau 1 giờ, kéo dài 24 giờ.
 * Một số điểm ngẫu nhiên được đánh dấu isImputed = true.
 */
function generateTimeSeries(
  farmId: string,
  sensorType: SensorType,
  hoursBack: number = 24,
): SensorReadingDto[] {
  const now = new Date();
  const readings: SensorReadingDto[] = [];

  const baseValues: Record<SensorType, { base: number; amplitude: number }> = {
    temperature: { base: 28, amplitude: 6 },
    humidity: { base: 70, amplitude: 15 },
    light: { base: 600, amplitude: 500 },
    soil_moisture: { base: 55, amplitude: 20 },
  };

  const config = baseValues[sensorType];

  // Các khoảng thời gian mô phỏng cảm biến bị lỗi (imputed gap)
  // Ví dụ: giờ thứ 5-7 và giờ thứ 18-19 bị mất tín hiệu
  const imputedHours = new Set([5, 6, 18]);

  for (let i = hoursBack; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = ts.getHours();

    // Hàm sin giả lập biến thiên ngày/đêm (nhiệt độ cao ban ngày, thấp ban đêm)
    const dayPhase = Math.sin((hour / 24) * 2 * Math.PI - Math.PI / 2);
    const noise = (Math.random() - 0.5) * config.amplitude * 0.3;
    const value = Number(
      (config.base + dayPhase * config.amplitude * 0.5 + noise).toFixed(1),
    );

    readings.push({
      farmId,
      sensorType,
      value,
      unit: SENSOR_UNITS[sensorType],
      isImputed: imputedHours.has(i % hoursBack === 0 ? 0 : i),
      recordedAt: ts.toISOString(),
    });
  }

  return readings;
}

/**
 * Snapshot mới nhất cho từng cảm biến — lấy phần tử cuối cùng từ chuỗi.
 */
function buildLatestSnapshot(farmId: string): SensorReadingDto[] {
  const sensorTypes: SensorType[] = ['temperature', 'humidity', 'light', 'soil_moisture'];
  return sensorTypes.map((sensorType) => {
    const series = generateTimeSeries(farmId, sensorType, 1);
    const last = series[series.length - 1];
    // Latest snapshot luôn là thực đo (cảm biến đang hoạt động)
    return { ...last, isImputed: false };
  });
}

// ── Mock data per farm ────────────────────────────────────────────────────────

const MOCK_ALERTS: Record<string, AlertDto[]> = {
  'farm-001': [
    {
      id: 'alert-001',
      farmId: 'farm-001',
      sensorType: 'temperature',
      severity: 'warning',
      threshold: 35,
      value: 36.5,
      suggestedAction: 'Bật quạt thông gió và tưới nước để hạ nhiệt độ.',
      acknowledged: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-002',
      farmId: 'farm-001',
      sensorType: 'soil_moisture',
      severity: 'danger',
      threshold: 30,
      value: 24.1,
      suggestedAction: 'Tưới nước ngay lập tức, độ ẩm đất xuống mức nguy hiểm.',
      acknowledged: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
  'farm-002': [
    {
      id: 'alert-003',
      farmId: 'farm-002',
      sensorType: 'humidity',
      severity: 'warning',
      threshold: 40,
      value: 38.2,
      suggestedAction: 'Kiểm tra hệ thống tưới phun sương.',
      acknowledged: true,
      acknowledgedBy: 'user-farmer-001',
      acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ── Service functions ──────────────────────────────────────────────────────────

/**
 * Giả lập GET /api/v1/monitoring/farms/:farmId/latest
 * Trả snapshot mới nhất từng cảm biến với ~1 giây trễ.
 */
export async function getLatest(farmId: string): Promise<SensorReadingDto[]> {
  return withMockDelay(buildLatestSnapshot(farmId));
}

/**
 * Giả lập GET /api/v1/monitoring/farms/:farmId/history
 * Trả chuỗi thời gian 24 giờ với các điểm isImputed được đánh dấu rõ ràng.
 */
export async function getHistory(
  farmId: string,
  params?: HistoryParams,
): Promise<SensorReadingDto[]> {
  const sensorType = params?.sensorType ?? 'temperature';
  const hoursBack = 24;
  const items = generateTimeSeries(farmId, sensorType, hoursBack);
  return withMockDelay(items);
}

/**
 * Giả lập GET /api/v1/monitoring/farms/:farmId/alerts
 */
export async function listAlerts(
  farmId: string,
  _params?: AlertsParams,
): Promise<ListResponse<AlertDto>> {
  const all = MOCK_ALERTS[farmId] ?? [];
  return withMockDelay({
    items: all,
    page: 1,
    limit: 20,
    total: all.length,
  });
}

/**
 * Giả lập POST /api/v1/monitoring/alerts/:id/acknowledge
 */
export async function acknowledgeAlert(alertId: string): Promise<{ success: true }> {
  // Update in-place trên mock store
  for (const alerts of Object.values(MOCK_ALERTS)) {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      break;
    }
  }
  return withMockDelay({ success: true as const });
}
