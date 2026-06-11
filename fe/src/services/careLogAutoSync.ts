/**
 * careLogAutoSync — kích hoạt đồng bộ hàng đợi care-log offline khi mạng phục hồi.
 *
 * NFR-R02: Offline care-log auto-sync khi reconnect, KHÔNG mất mát.
 * Trigger: `window` event `online` (browser network online).
 * Idempotent: `clientRecordId` đảm bảo BE không tạo duplicate.
 *
 * UI callbacks (NFR-R02 demo):
 *   onQueued(count)  — gọi khi log mới được enqueue offline (navigator.onLine === false).
 *   onSynced(count)  — gọi khi drain hoàn tất và có ít nhất 1 log được sync.
 */

import { listQueue, dequeue, type PendingCareLog } from './careLogOfflineQueue';
import { syncCareLogs, type CreateCareLogDto } from './careLogService';

let initialized = false;
let draining = false;

// ── UI event subscribers ─────────────────────────────────────────────────────

type QueuedHandler = (pendingCount: number) => void;
type SyncedHandler = (syncedCount: number) => void;

const queuedHandlers = new Set<QueuedHandler>();
const syncedHandlers = new Set<SyncedHandler>();

/** Subscribe to "log enqueued offline" event. Returns unsubscribe fn. */
export function onCareLogQueued(handler: QueuedHandler): () => void {
  queuedHandlers.add(handler);
  return () => queuedHandlers.delete(handler);
}

/** Subscribe to "queue drained / synced" event. Returns unsubscribe fn. */
export function onCareLogSynced(handler: SyncedHandler): () => void {
  syncedHandlers.add(handler);
  return () => syncedHandlers.delete(handler);
}

/** Call này khi enqueue một care-log offline (gọi từ careLogService). */
export function notifyCareLogQueued(pendingCount: number): void {
  queuedHandlers.forEach((h) => {
    try { h(pendingCount); } catch { /* ignore */ }
  });
}

// ── Core drain logic ─────────────────────────────────────────────────────────

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
  let totalSynced = 0;
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
            totalSynced++;
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
    if (totalSynced > 0) {
      syncedHandlers.forEach((h) => {
        try { h(totalSynced); } catch { /* ignore */ }
      });
    }
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
