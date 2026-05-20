/**
 * careLogAutoSync — kích hoạt đồng bộ hàng đợi care-log offline khi mạng phục hồi.
 *
 * NFR-R02: Offline care-log auto-sync khi reconnect, KHÔNG mất mát.
 * Trigger: `window` event `online` (browser network online).
 * Idempotent: `clientRecordId` đảm bảo BE không tạo duplicate.
 */

import { listQueue, dequeue, type PendingCareLog } from './careLogOfflineQueue';
import { syncCareLogs, type CreateCareLogDto } from './careLogService';

let initialized = false;
let draining = false;

function toCreateDto(pending: PendingCareLog): CreateCareLogDto {
  // Evidence URLs (nếu có) sẽ được gắn riêng qua POST /farms/:id/evidence sau khi
  // care-log đã được tạo — care-log sync payload không bao gồm.
  return {
    action: pending.action,
    notes: pending.notes,
    performedAt: pending.performedAt,
    standardStepId: pending.standardStepId,
    clientRecordId: pending.clientRecordId,
  };
}

function groupByFarm(items: PendingCareLog[]): Record<string, PendingCareLog[]> {
  const groups: Record<string, PendingCareLog[]> = {};
  for (const item of items) {
    (groups[item.farmId] ??= []).push(item);
  }
  return groups;
}

export async function drainCareLogQueue(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    const pending = await listQueue();
    if (pending.length === 0) return;

    const groups = groupByFarm(pending);
    for (const [farmId, logs] of Object.entries(groups)) {
      try {
        await syncCareLogs(farmId, logs.map(toCreateDto));
        // BE chấp nhận → xóa khỏi hàng đợi (clientRecordId idempotent).
        for (const log of logs) {
          try {
            await dequeue(log.clientRecordId);
          } catch {
            // bỏ qua lỗi xóa lẻ — giữ entry để thử lại lần sau.
          }
        }
      } catch {
        // Lỗi mạng / 5xx → giữ nguyên, đợi lần online tiếp theo.
      }
    }
  } finally {
    draining = false;
  }
}

export function initCareLogAutoSync(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  initialized = true;

  const trigger = () => {
    void drainCareLogQueue();
  };

  window.addEventListener('online', trigger);
  // Cũng thử ngay khi khởi động nếu đang online.
  if (navigator.onLine !== false) {
    trigger();
  }
}
