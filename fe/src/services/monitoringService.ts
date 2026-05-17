/**
 * monitoringService — gọi thực tế tới Monitoring Service qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.5):
 *   GET  /api/v1/monitoring/farms/:farmId/latest   → SensorReadingDto[]
 *   GET  /api/v1/monitoring/farms/:farmId/history  → { items: SensorReadingDto[] }
 *   GET  /api/v1/monitoring/farms/:farmId/alerts   → ListResponse<AlertDto>
 *   POST /api/v1/monitoring/alerts/:id/acknowledge → { success: true }
 *
 * Tất cả trường JSON đều camelCase (design.md §1.1).
 * Bearer token được gắn tự động bởi request interceptor.
 */

import apiClient from '@/api/client';

// ── DTO types (camelCase — khớp backend design.md §4.5) ───────────────────────

export type SensorType = 'temperature' | 'humidity' | 'light' | 'soil_moisture';

export interface SensorReadingDto {
  farmId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  isImputed: boolean;
  recordedAt: string; // ISO-8601
}

interface LatestSensorResponse {
  farmId: string;
  readings: SensorReadingDto[];
  updatedAt: string;
}

export interface AlertDto {
  id: string;
  farmId: string;
  farmName?: string | null;
  sensorType: string;
  severity: 'warning' | 'danger';
  threshold: number;
  value: number;
  suggestedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedByName?: string | null;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface HistoryParams {
  from?: string;
  to?: string;
  interval?: string;
  sensorType?: SensorType;
}

export interface AlertsParams {
  status?: 'unacknowledged' | 'acknowledged' | 'all';
  severity?: 'warning' | 'danger';
  page?: number;
  limit?: number;
}

// ── Service functions ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/monitoring/farms/:farmId/latest
 * Trả snapshot mới nhất từ Redis cho từng loại cảm biến.
 */
export async function getLatest(farmId: string): Promise<SensorReadingDto[]> {
  const { data } = await apiClient.get<LatestSensorResponse>(
    `/monitoring/farms/${farmId}/latest`,
  );
  return data.readings;
}

/**
 * GET /api/v1/monitoring/farms/:farmId/history
 * Trả chuỗi thời gian lịch sử cảm biến từ InfluxDB.
 */
export async function getHistory(
  farmId: string,
  params?: HistoryParams,
): Promise<SensorReadingDto[]> {
  const { data } = await apiClient.get<SensorReadingDto[]>(
    `/monitoring/farms/${farmId}/history`,
    { params },
  );
  return data;
}

/**
 * GET /api/v1/monitoring/farms/:farmId/alerts
 */
export async function listAlerts(
  farmId: string,
  params?: AlertsParams,
): Promise<ListResponse<AlertDto>> {
  const { data } = await apiClient.get<ListResponse<AlertDto>>(
    `/monitoring/farms/${farmId}/alerts`,
    { params },
  );
  return data;
}

/**
 * POST /api/v1/monitoring/alerts/:id/acknowledge
 */
export async function acknowledgeAlert(alertId: string): Promise<{ success: true }> {
  const { data } = await apiClient.post<{ success: true }>(
    `/monitoring/alerts/${alertId}/acknowledge`,
  );
  return data;
}
