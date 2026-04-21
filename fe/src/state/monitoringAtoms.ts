/**
 * Monitoring Atoms — Jotai state cho realtime sensor data.
 *
 * Thiết kế:
 *   - latestSensorMapAtom: Map<farmId, SensorReadingDto[]>
 *     Mỗi entry là snapshot mới nhất cho từng loại cảm biến của một farm.
 *     REST cold start ghi toàn bộ mảng; WebSocket sensor_update chỉ ghi đè
 *     một phần tử (khớp sensorType).
 *
 *   - updateSensorReadingAtom: write-only atom để cập nhật một reading đơn lẻ.
 *     Dùng bởi monitoringSocket callback → merge vào map hiện tại.
 */

import { atom } from 'jotai';
import type { SensorReadingDto } from '@/services/monitoringService';

// ── Alert badge atoms ─────────────────────────────────────────────────────────

/**
 * Map<farmId, number> — số cảnh báo chưa acknowledge per farm.
 * Dùng cho badge thông báo cross-screen (Phase 7, Phase 15).
 * Seed từ REST cold start; cập nhật realtime qua WebSocket alert_created.
 */
export const farmAlertBadgeAtom = atom<Map<string, number>>(new Map());

/** Ghi đè toàn bộ số badge cho một farm (dùng sau REST cold start). */
export const setFarmAlertBadgeAtom = atom(
  null,
  (_get, set, { farmId, count }: { farmId: string; count: number }) => {
    set(farmAlertBadgeAtom, (prev) => {
      const next = new Map(prev);
      next.set(farmId, count);
      return next;
    });
  },
);

/** Tăng badge +1 khi có alert_created mới từ WebSocket. */
export const incrementFarmAlertBadgeAtom = atom(
  null,
  (_get, set, farmId: string) => {
    set(farmAlertBadgeAtom, (prev) => {
      const next = new Map(prev);
      next.set(farmId, (next.get(farmId) ?? 0) + 1);
      return next;
    });
  },
);

/** Giảm badge -1 khi acknowledge một alert. */
export const decrementFarmAlertBadgeAtom = atom(
  null,
  (_get, set, farmId: string) => {
    set(farmAlertBadgeAtom, (prev) => {
      const next = new Map(prev);
      const cur = next.get(farmId) ?? 0;
      next.set(farmId, Math.max(0, cur - 1));
      return next;
    });
  },
);

/** Map<farmId, SensorReadingDto[]> — snapshot mới nhất từng cảm biến per farm */
export const latestSensorMapAtom = atom<Map<string, SensorReadingDto[]>>(new Map());

/**
 * Write-only atom: nhận một SensorReadingDto và merge vào latestSensorMapAtom.
 * Tìm và thay thế phần tử khớp sensorType trong mảng của farmId tương ứng.
 * Nếu chưa có entry cho farmId thì tạo mới.
 */
export const mergeSensorReadingAtom = atom(
  null,
  (get, set, reading: SensorReadingDto) => {
    const current = get(latestSensorMapAtom);
    const existing = current.get(reading.farmId) ?? [];
    const updated = existing.some((r) => r.sensorType === reading.sensorType)
      ? existing.map((r) => (r.sensorType === reading.sensorType ? reading : r))
      : [...existing, reading];

    const next = new Map(current);
    next.set(reading.farmId, updated);
    set(latestSensorMapAtom, next);
  },
);

/**
 * Write atom: seed đầy đủ một farm khi REST cold start hoàn thành.
 * Ghi đè toàn bộ mảng cho farmId đó.
 */
export const seedLatestForFarmAtom = atom(
  null,
  (get, set, { farmId, readings }: { farmId: string; readings: SensorReadingDto[] }) => {
    const next = new Map(get(latestSensorMapAtom));
    next.set(farmId, readings);
    set(latestSensorMapAtom, next);
  },
);
