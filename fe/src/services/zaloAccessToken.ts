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
