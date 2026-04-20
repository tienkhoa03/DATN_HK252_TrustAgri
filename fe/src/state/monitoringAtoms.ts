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
