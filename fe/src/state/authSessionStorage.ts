import { getDefaultStore } from 'jotai';
import { authSessionAtom, type AuthSession } from '@/state/authAtoms';

const STORAGE_KEY = 'trustagri.authSession.v1';

function safeParseAuthSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null;
    }
    // Backwards compat: if roles missing, derive from role
    if (!Array.isArray(parsed.roles)) {
      parsed.roles = [parsed.role];
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Khôi phục & đồng bộ auth session trong phạm vi 1 tab.
 * - Dùng sessionStorage (không lưu vĩnh viễn như localStorage).
 * - Tự xóa nếu data hỏng.
 */
export function bootstrapAuthSessionStorage(): () => void {
  if (typeof window === 'undefined') return () => {};

  const store = getDefaultStore();

  // 1) Rehydrate on startup
  try {
    const restored = safeParseAuthSession(window.sessionStorage.getItem(STORAGE_KEY));
    if (restored) {
      store.set(authSessionAtom, restored);
    }
  } catch {
    // ignore storage errors
  }

  // 2) Persist on changes
  const unsub = store.sub(authSessionAtom, () => {
    const value = store.get(authSessionAtom);
    try {
      if (value) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore quota / storage errors
    }
  });

  return unsub;
}

