import { ENV } from '@/config/env';

/**
 * Resolves after a random delay between [minMs, maxMs].
 * Used internally by withMockDelay.
 */
function sleep(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a payload value (or factory function) in a Promise with simulated network latency.
 *
 * @example
 * return withMockDelay({ items: farms, page: 1, limit: 10, total: 2 });
 *
 * @param payload  The value to resolve with, or a zero-arg factory returning the value.
 * @param minMs    Minimum delay in ms. Defaults to 800.
 * @param maxMs    Maximum delay in ms. Defaults to 1200.
 */
export async function withMockDelay<T>(
  payload: T | (() => T),
  minMs = 800,
  maxMs = 1200,
): Promise<T> {
  await sleep(minMs, maxMs);
  return typeof payload === 'function' ? (payload as () => T)() : payload;
}

/**
 * True when the app is running with mock services enabled.
 * Driven by the VITE_USE_MOCK environment variable.
 */
export const USE_MOCK = ENV.USE_MOCK;
