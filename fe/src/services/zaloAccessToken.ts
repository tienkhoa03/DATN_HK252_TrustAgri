import { getAccessToken } from 'zmp-sdk';
import { ENV } from '@/config/env';

/**
 * Resolves Zalo access token for auth flow.
 * - Dev override: use VITE_ZALO_API_KEY when provided.
 * - Default: call zmp-sdk getAccessToken().
 */
export async function resolveZaloAccessToken(): Promise<string> {
  if (ENV.ZALO_API_KEY) {
    return ENV.ZALO_API_KEY;
  }
  return getAccessToken();
}

export interface ZaloProfileFallback {
  zaloId?: string;
  zaloName?: string;
  zaloAvatar?: string;
}

/**
 * Lấy id/tên/avatar Zalo qua zmp-sdk getUserInfo (chạy trên máy user — trong VN).
 * Backend dùng làm fallback khi gọi /me bị Zalo chặn theo IP (server ngoài VN, error -501).
 * Fail-soft: trả {} nếu SDK không hỗ trợ / user từ chối / lỗi — KHÔNG block login.
 */
export async function resolveZaloUserInfo(): Promise<ZaloProfileFallback> {
  try {
    const { getUserInfo } = await import('zmp-sdk/apis');
    const result = (await getUserInfo({})) as {
      userInfo?: { id?: string; name?: string; avatar?: string };
    };
    const info = result.userInfo;
    if (!info?.id) return {};
    return {
      zaloId: info.id,
      zaloName: info.name?.trim() || undefined,
      zaloAvatar: info.avatar?.trim() || undefined,
    };
  } catch {
    return {};
  }
}
