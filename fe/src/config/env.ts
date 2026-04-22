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

/** Phiên bản hợp đồng API frontend ↔ gateway (đồng bộ specs 5.0). */
const apiContractVersion =
  ((import.meta.env.VITE_API_CONTRACT_VERSION as string | undefined) ?? '5.0').trim() || '5.0';

export const ENV = {
  /** Full base URL including /api/v1 prefix, e.g. https://api.example.com/api/v1 */
  API_BASE_URL: validateBaseUrl(rawBaseUrl),

  /**
   * Đóng băng hợp đồng DTO/endpoint theo `specs/*-specification/design.md` (Phase 20.2).
   * Gửi kèm request qua header để gateway/observability phân biệt client.
   */
  API_CONTRACT_VERSION: apiContractVersion,

  /**
   * Khi true: luồng auth ưu tiên mock; nếu có VITE_DEV_LOGIN_SECRET thì đổi sang JWT thật (dev-login) để các API khác dùng Bearer.
   */
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',

  /**
   * Temporary development override for Zalo access token.
   * When set, UI auth flow will use this value instead of calling zmp-sdk getAccessToken().
   */
  ZALO_API_KEY: ((import.meta.env.VITE_ZALO_API_KEY as string | undefined) ?? '').trim(),

  /**
   * Trùng DEV_LOGIN_SECRET trên auth-service — khi USE_MOCK + secret: gọi POST /auth/dev-login để lấy JWT thật.
   * Cảnh báo: giá trị nằm trong bundle; chỉ dùng local dev.
   */
  DEV_LOGIN_SECRET: ((import.meta.env.VITE_DEV_LOGIN_SECRET as string | undefined) ?? '').trim(),

  /** Tùy chọn: ép zalo_id cho dev-login (không infer từ VITE_ZALO_API_KEY). */
  DEV_LOGIN_ZALO_ID: ((import.meta.env.VITE_DEV_LOGIN_ZALO_ID as string | undefined) ?? '').trim(),

  /**
   * UUID v4 sản phẩm tĩnh cho dev: dùng khi mở màn chi tiết không có :productId trên URL (demo).
   * Phải trùng một bản ghi thật trên DB nếu gọi API thật.
   */
  PUBLIC_DEMO_PRODUCT_ID: ((import.meta.env.VITE_PUBLIC_DEMO_PRODUCT_ID as string | undefined) ?? '').trim(),

  /** Default request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 15_000,

  /** True when running on localhost (used to relax some checks in dev) */
  IS_LOCAL:
    rawBaseUrl.includes('localhost') ||
    rawBaseUrl.includes('127.0.0.1') ||
    rawBaseUrl.includes('0.0.0.0'),
} as const;
