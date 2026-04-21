/**
 * Điểm vào mock cho luồng xác thực — chỉ dùng khi `VITE_USE_MOCK=true`.
 * Farm / monitoring / … luôn gọi HTTP thật (xem `env.ts`).
 */

import { withMockDelay, MOCK_NETWORK_DELAY_MS, USE_MOCK } from '@/services/mocks';

export { withMockDelay, MOCK_NETWORK_DELAY_MS, USE_MOCK };

export {
  mockLogin,
  mockVerify,
  mockLogout,
  mockGetMe,
  mockUpdateMe,
} from '@/services/mocks/mockAuthService';
