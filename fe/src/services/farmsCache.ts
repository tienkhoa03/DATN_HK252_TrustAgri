/**
 * farmsCache — offline-first cache cho danh sách vườn (NFR-A02).
 *
 * Lưu local kết quả `listFarms` mới nhất theo `ownerId`. Khi mất mạng hoặc backend lỗi,
 * `useFarms` sẽ fallback đọc từ cache và set `fromCache=true` để UI hiển thị banner.
 *
 * Storage: localStorage (persist qua reload, khác sessionStorage của auth).
 * TTL: 7 ngày (sau đó coi là stale, vẫn hiển thị nhưng có warning).
 */

import type { FarmDto } from '@/services/farmService';

const STORAGE_PREFIX = 'trustagri.farms.cache.v1';
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedFarmsPayload {
  ownerId: string;
  items: FarmDto[];
  total: number;
  cachedAt: string; // ISO
}

function key(ownerId: string): string {
  return `${STORAGE_PREFIX}:${ownerId}`;
}

export function saveFarmsCache(ownerId: string, items: FarmDto[], total: number): void {
  if (typeof window === 'undefined') return;
  if (!ownerId) return;
  try {
    const payload: CachedFarmsPayload = {
      ownerId,
      items,
      total,
      cachedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key(ownerId), JSON.stringify(payload));
  } catch {
    /* quota exceeded / storage disabled — bỏ qua */
  }
}

export interface CachedFarmsResult {
  items: FarmDto[];
  total: number;
  cachedAt: Date;
  isStale: boolean;
}

export function readFarmsCache(ownerId: string): CachedFarmsResult | null {
  if (typeof window === 'undefined') return null;
  if (!ownerId) return null;
  try {
    const raw = window.localStorage.getItem(key(ownerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFarmsPayload;
    if (
      !parsed ||
      parsed.ownerId !== ownerId ||
      !Array.isArray(parsed.items) ||
      typeof parsed.cachedAt !== 'string'
    ) {
      return null;
    }
    const cachedAt = new Date(parsed.cachedAt);
    const age = Date.now() - cachedAt.getTime();
    return {
      items: parsed.items,
      total: parsed.total ?? parsed.items.length,
      cachedAt,
      isStale: age > STALE_AFTER_MS,
    };
  } catch {
    return null;
  }
}

export function clearFarmsCache(ownerId: string): void {
  if (typeof window === 'undefined') return;
  if (!ownerId) return;
  try {
    window.localStorage.removeItem(key(ownerId));
  } catch {
    /* ignore */
  }
}
