import { ENV } from '@/config/env';

/** Độ trễ mặc định giả lập mạng (Phase 20 — tasks.md 20.1): 1 giây cố định. */
export const MOCK_NETWORK_DELAY_MS = 1000;

/**
 * Wraps a payload value (or factory function) in a Promise with simulated network latency.
 *
 * @example
 * return withMockDelay({ items: farms, page: 1, limit: 10, total: 2 });
 *
 * @param payload   The value to resolve with, or a zero-arg factory returning the value.
 * @param delayMs   Delay in ms. Defaults to MOCK_NETWORK_DELAY_MS (1000).
 */
export async function withMockDelay<T>(
  payload: T | (() => T),
  delayMs: number = MOCK_NETWORK_DELAY_MS,
): Promise<T> {
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return typeof payload === 'function' ? (payload as () => T)() : payload;
}

/**
 * True when the app is running with mock services enabled.
 * `USE_MOCK` chỉ dùng trong luồng auth/profile (xem `config/env.ts`).
 */
export const USE_MOCK = ENV.USE_MOCK;
