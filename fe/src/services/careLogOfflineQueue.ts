/**
 * careLogOfflineQueue — hàng đợi offline cho nhật ký chăm sóc.
 *
 * Dùng IndexedDB để lưu trữ nhật ký chờ đồng bộ khi mạng khả dụng.
 * Thiết kế idempotent: mỗi bản ghi được định danh bởi clientRecordId.
 *
 * FR: FR-F09 (đồng bộ batch hàng đợi offline)
 */

const DB_NAME = 'trustagri_offline';
const STORE_NAME = 'care_log_queue';
const DB_VERSION = 1;

export interface PendingCareLog {
  clientRecordId: string;
  farmId: string;
  action: string;
  notes?: string;
  performedAt: string;    // ISO-8601
  standardStepId?: string;
  evidenceUrls: string[]; // URLs ảnh đã upload
  queuedAt: string;       // ISO-8601 thời điểm thêm vào hàng đợi
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clientRecordId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Thêm hoặc cập nhật một bản ghi vào hàng đợi.
 * Idempotent — ghi đè nếu clientRecordId đã tồn tại.
 */
export async function enqueue(log: PendingCareLog): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(log);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Xóa một bản ghi khỏi hàng đợi sau khi đồng bộ thành công.
 */
export async function dequeue(clientRecordId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(clientRecordId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Lấy toàn bộ hàng đợi hiện tại, sắp xếp theo queuedAt tăng dần.
 */
export async function listQueue(): Promise<PendingCareLog[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items = (req.result as PendingCareLog[]).sort(
        (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime(),
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Đếm số bản ghi còn trong hàng đợi.
 */
export async function countQueue(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Xóa toàn bộ hàng đợi (dùng sau khi đồng bộ thành công tất cả).
 */
export async function clearAll(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Tạo clientRecordId duy nhất theo định dạng crid-<timestamp>-<random>.
 */
export function generateClientRecordId(): string {
  return `crid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
