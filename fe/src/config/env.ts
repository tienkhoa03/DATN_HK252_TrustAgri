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

/**
 * 4 chế độ xác thực — chọn qua VITE_AUTH_MODE:
 *   'zalo-oauth' — Zalo OAuth thật (getAccessToken từ zmp-sdk → POST /auth/login).
 *                  Mặc định. Chạy trong Zalo Mini App env.
 *   'zalo-token' — Token Zalo dán thủ công (VITE_ZALO_API_KEY) → POST /auth/login.
 *                  Dùng khi không chạy trong Mini App nhưng có token thật để test.
 *   'dev-seeded' — User giả seed sẵn DB (be/scripts/seed-dev-users.sql) → POST /auth/dev-login.
 *                  Yêu cầu BE bật AUTH_DEV_LOGIN_ENABLED + DEV_LOGIN_SECRET.
 *   'password'   — Form username/password → POST /auth/password-login.
 *                  Yêu cầu BE bật AUTH_PASSWORD_LOGIN_ENABLED.
 *
 * Mode 1, 2, 3 đều biểu hiện như Zalo Mini App: auto-bootstrap, KHÔNG hiện LoginScreen.
 * Mode 4 hiển thị form đăng nhập username/password.
 */
export type AuthMode = 'zalo-oauth' | 'zalo-token' | 'dev-seeded' | 'password';

const VALID_AUTH_MODES: ReadonlyArray<AuthMode> = ['zalo-oauth', 'zalo-token', 'dev-seeded', 'password'];

function resolveAuthMode(raw: string | undefined): AuthMode {
  const normalized = (raw ?? '').trim();
  // Backward compat: 'zalo' -> 'zalo-oauth'
  if (normalized === '' || normalized === 'zalo') return 'zalo-oauth';
  if ((VALID_AUTH_MODES as ReadonlyArray<string>).includes(normalized)) {
    return normalized as AuthMode;
  }
  throw new Error(
    `[env] VITE_AUTH_MODE không hợp lệ: "${normalized}". Giá trị hợp lệ: ${VALID_AUTH_MODES.join(', ')}.`,
  );
}

const authMode = resolveAuthMode(import.meta.env.VITE_AUTH_MODE as string | undefined);

const zaloApiKey = ((import.meta.env.VITE_ZALO_API_KEY as string | undefined) ?? '').trim();
const devLoginSecret = ((import.meta.env.VITE_DEV_LOGIN_SECRET as string | undefined) ?? '').trim();
const devLoginZaloId = ((import.meta.env.VITE_DEV_LOGIN_ZALO_ID as string | undefined) ?? '').trim();

// Validate env yêu cầu của từng mode — fail fast, KHÔNG silent fallback.
if (authMode === 'zalo-token' && !zaloApiKey) {
  throw new Error(
    '[env] VITE_AUTH_MODE=zalo-token yêu cầu VITE_ZALO_API_KEY (Zalo access token thật để test).',
  );
}
if (authMode === 'dev-seeded') {
  if (!devLoginSecret || devLoginSecret.length < 16) {
    throw new Error(
      '[env] VITE_AUTH_MODE=dev-seeded yêu cầu VITE_DEV_LOGIN_SECRET (tối thiểu 16 ký tự, khớp DEV_LOGIN_SECRET ở auth-service).',
    );
  }
  if (!devLoginZaloId) {
    throw new Error(
      '[env] VITE_AUTH_MODE=dev-seeded yêu cầu VITE_DEV_LOGIN_ZALO_ID (zalo_id của user đã seed, ví dụ zalo_dev_farmer_001).',
    );
  }
}

export const ENV = {
  /** Full base URL including /api/v1 prefix, e.g. https://api.example.com/api/v1 */
  API_BASE_URL: validateBaseUrl(rawBaseUrl),

  /**
   * Base URL cho trang truy xuất nguồn gốc (mã QR encode vào đây).
   * Dev laptop:  http://localhost:3000/trace
   * Dev điện thoại: https://<ngrok-id>.ngrok-free.app/trace  (ngrok http 3000)
   * Production:  https://trustagri.vn/trace
   */
  TRACE_BASE_URL: ((import.meta.env.VITE_TRACE_BASE_URL as string | undefined) ?? 'http://localhost:3000/trace').trim(),

  /**
   * Đóng băng hợp đồng DTO/endpoint theo `specs/*-specification/design.md` (Phase 20.2).
   * Gửi kèm request qua header để gateway/observability phân biệt client.
   */
  API_CONTRACT_VERSION: apiContractVersion,

  /**
   * @deprecated Dùng AUTH_MODE thay thế. Giữ tạm để mock service layer (mockFarmService, ...) tham chiếu.
   * KHÔNG dùng cho auth flow nữa — đã được AUTH_MODE thay thế.
   */
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',

  /**
   * Token Zalo thủ công. Dùng cho AUTH_MODE='zalo-token'.
   * Cảnh báo: lưu trong bundle; chỉ dùng dev/staging với token có thời hạn ngắn.
   */
  ZALO_API_KEY: zaloApiKey,

  /**
   * Secret cho dev-login (AUTH_MODE='dev-seeded'). Trùng DEV_LOGIN_SECRET ở auth-service.
   * Cảnh báo: lưu trong bundle; chỉ dùng local dev.
   */
  DEV_LOGIN_SECRET: devLoginSecret,

  /** Zalo ID của user đã seed sẵn DB (AUTH_MODE='dev-seeded'). Vd: zalo_dev_farmer_001. */
  DEV_LOGIN_ZALO_ID: devLoginZaloId,

  /** Default request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 15_000,

  /** True when running on localhost (used to relax some checks in dev) */
  IS_LOCAL:
    rawBaseUrl.includes('localhost') ||
    rawBaseUrl.includes('127.0.0.1') ||
    rawBaseUrl.includes('0.0.0.0'),

  /**
   * Chế độ xác thực — chọn qua VITE_AUTH_MODE. Xem `AuthMode` để biết chi tiết.
   */
  AUTH_MODE: authMode,
} as const;
