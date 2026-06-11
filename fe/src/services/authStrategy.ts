/**
 * Auth strategy dispatcher — bootstrap session theo VITE_AUTH_MODE.
 *
 * 4 chế độ:
 *  1. 'zalo-oauth' — getAccessToken() từ ZMP SDK → POST /auth/login.
 *  2. 'zalo-token' — VITE_ZALO_API_KEY → POST /auth/login.
 *  3. 'dev-seeded' — VITE_DEV_LOGIN_SECRET + VITE_DEV_LOGIN_ZALO_ID → POST /auth/dev-login.
 *  4. 'password'   — KHÔNG auto-bootstrap; trả về RequirePasswordLoginError để RootEntry redirect /login.
 *
 * Thiết kế: chỉ trả về AuthSession (có Bearer token). Profile load riêng ở RootEntry/useAuth.
 */

import { ENV } from '@/config/env';
import * as authService from '@/services/authService';
import { resolveZaloAccessToken, resolveZaloUserInfo } from '@/services/zaloAccessToken';
import type { AuthSession } from '@/state/authAtoms';

/** Throw bởi `bootstrapAuthSession()` khi mode='password' để RootEntry redirect /login. */
export class RequirePasswordLoginError extends Error {
  readonly kind = 'require-password-login' as const;
  constructor() {
    super('AUTH_MODE=password requires manual login via /login screen');
    this.name = 'RequirePasswordLoginError';
  }
}

/**
 * Lấy session theo chế độ auth hiện tại.
 *
 * Lỗi:
 *  - `RequirePasswordLoginError` khi mode='password' → caller redirect /login.
 *  - `Error` khác (mạng/zalo SDK) → caller hiển thị snackbar + giữ trạng thái chưa login.
 */
/**
 * Lấy số điện thoại từ ZMP SDK (best-effort, fail-soft).
 *
 * Production: getPhoneNumber() trả về một `token` (code) — server đổi lấy số thật qua
 * Zalo /me/info (cần ZALO_APP_SECRET_KEY). Ta trả về `phoneToken`.
 * Dev/staging: một số phiên bản ZMP trả thẳng `number`/`phoneNumber` — trả về `phoneNumber`.
 */
const PHONE_TIMEOUT_MS = 8000;

async function tryGetPhoneNumber(): Promise<{ phoneNumber?: string; phoneToken?: string }> {
  try {
    const { getPhoneNumber } = await import('zmp-sdk/apis');
    // Gọi dạng promise (KHÔNG truyền success/fail) — truyền callback khiến một số phiên
    // bản ZMP route kết quả/lỗi vào callback và để promise treo vĩnh viễn → app loading mãi.
    // Bọc thêm timeout: phone là best-effort, KHÔNG được block luồng login.
    const result = (await Promise.race([
      getPhoneNumber(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getPhoneNumber timeout')), PHONE_TIMEOUT_MS),
      ),
    ])) as {
      number?: string;
      phoneNumber?: string;
      token?: string;
    };
    const plain = result.phoneNumber ?? result.number;
    if (plain && /^\+?[0-9]{9,15}$/.test(plain)) {
      return { phoneNumber: plain };
    }
    if (result.token) {
      return { phoneToken: result.token };
    }
  } catch {
    // Không hỗ trợ / user từ chối / timeout — bỏ qua, login vẫn tiếp tục không có phone
  }
  return {};
}

export async function bootstrapAuthSession(): Promise<AuthSession> {
  switch (ENV.AUTH_MODE) {
    case 'zalo-oauth': {
      const zaloToken = await resolveZaloAccessToken();
      if (!zaloToken) {
        throw new Error('Không lấy được Zalo access token. Đảm bảo ứng dụng chạy trong Zalo Mini App.');
      }
      // Lấy phone best-effort (fail-soft — không block login nếu SDK không hỗ trợ)
      const { phoneNumber, phoneToken } = await tryGetPhoneNumber();
      // Lấy profile Zalo (fallback khi /me bị chặn theo IP ở backend — error -501)
      const zaloProfile = await resolveZaloUserInfo();
      return authService.login(zaloToken, phoneNumber, phoneToken, zaloProfile);
    }

    case 'zalo-token': {
      // ENV đã validate VITE_ZALO_API_KEY tồn tại ở startup.
      return authService.login(ENV.ZALO_API_KEY);
    }

    case 'dev-seeded': {
      // ENV đã validate VITE_DEV_LOGIN_SECRET + VITE_DEV_LOGIN_ZALO_ID ở startup.
      return authService.devLogin(ENV.DEV_LOGIN_SECRET, ENV.DEV_LOGIN_ZALO_ID);
    }

    case 'password': {
      throw new RequirePasswordLoginError();
    }

    default: {
      // exhaustive check — TS sẽ báo nếu thiếu case
      const _exhaustive: never = ENV.AUTH_MODE;
      throw new Error(`AUTH_MODE không được hỗ trợ: ${String(_exhaustive)}`);
    }
  }
}

/** True khi mode hiện tại tự bootstrap (1, 2, 3) — không hiện LoginScreen. */
export function isAutoBootstrapMode(): boolean {
  return ENV.AUTH_MODE !== 'password';
}

/** True khi mode hiện tại là form đăng nhập (4) — RootEntry redirect /login. */
export function isPasswordMode(): boolean {
  return ENV.AUTH_MODE === 'password';
}
