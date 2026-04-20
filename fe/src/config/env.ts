/**
 * Centralized environment config.
 * All VITE_ vars are read here; import this module instead of import.meta.env directly.
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

/**
 * HTTPS-only enforcement for non-local environments.
 * Throws a descriptive error at startup so misconfiguration is caught immediately.
 */
function validateBaseUrl(url: string): string {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('[env] VITE_API_BASE_URL phải được cấu hình trong file .env');
  }
  const isLocalhost =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('0.0.0.0');

  if (!isLocalhost && !url.startsWith('https://')) {
    throw new Error(
      `[env] VITE_API_BASE_URL phải dùng HTTPS ở môi trường không phải local. Giá trị hiện tại: "${url}"`,
    );
  }
  return url;
}

export const ENV = {
  /** Full base URL including /api/v1 prefix, e.g. https://api.example.com/api/v1 */
  API_BASE_URL: validateBaseUrl(rawBaseUrl),

  /** When true, every service module returns mock data instead of calling the real API */
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',

  /**
   * Temporary development override for Zalo access token.
   * When set, UI auth flow will use this value instead of calling zmp-sdk getAccessToken().
   */
  ZALO_API_KEY: ((import.meta.env.VITE_ZALO_API_KEY as string | undefined) ?? '').trim(),

  /** Default request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 15_000,

  /** True when running on localhost (used to relax some checks in dev) */
  IS_LOCAL:
    rawBaseUrl.includes('localhost') ||
    rawBaseUrl.includes('127.0.0.1') ||
    rawBaseUrl.includes('0.0.0.0'),
} as const;
