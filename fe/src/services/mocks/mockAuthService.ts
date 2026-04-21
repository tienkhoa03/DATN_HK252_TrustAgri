import { withMockDelay } from './index';

/**
 * Mirrors UserProfileDto from backend design.md §4.1
 */
export interface UserProfileDto {
  userId: string;
  zaloId: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  traderProfile?: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  };
  farmerProfile?: {
    region: string;
    experienceYears: number;
  };
  buyerProfile?: {
    organizationName?: string;
  };
  createdAt: string;
  lastLogin: string;
}

/** Mirrors POST /api/v1/auth/login response */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  expiresAt: string;
}

/** Mirrors POST /api/v1/auth/verify response */
export interface VerifyResponseDto {
  userId: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  valid: true;
}

/** UUID cố định — khớp `be/scripts/seed-dev-users.sql` (dev / mock). */
export const MOCK_USER_IDS = {
  farmer: 'a0000001-0000-4000-8000-000000000001',
  trader: 'a0000001-0000-4000-8000-000000000002',
  buyer: 'a0000001-0000-4000-8000-000000000003',
  guest: 'a0000001-0000-4000-8000-000000000004',
} as const;

export const MOCK_ZALO_IDS = {
  farmer: 'zalo_dev_farmer_001',
  trader: 'zalo_dev_trader_001',
  buyer: 'zalo_dev_buyer_001',
  guest: 'zalo_dev_guest_001',
} as const;

// --------------- Mock data fixtures ---------------

const MOCK_FARMER_PROFILE: UserProfileDto = {
  userId: MOCK_USER_IDS.farmer,
  zaloId: MOCK_ZALO_IDS.farmer,
  role: 'farmer',
  displayName: 'Nguyễn Văn An',
  phone: '0901234567',
  avatarUrl: 'https://picsum.photos/seed/farmer001/64/64',
  farmerProfile: {
    region: 'Tiền Giang',
    experienceYears: 8,
  },
  createdAt: '2024-01-15T07:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

const MOCK_TRADER_PROFILE: UserProfileDto = {
  userId: MOCK_USER_IDS.trader,
  zaloId: MOCK_ZALO_IDS.trader,
  role: 'trader',
  displayName: 'Trần Thị Bích',
  phone: '0912345678',
  avatarUrl: 'https://picsum.photos/seed/trader001/64/64',
  traderProfile: {
    companyName: 'Công ty TNHH Nông sản Sạch Miền Tây',
    region: 'Cần Thơ',
    capacity: '500 tấn/tháng',
    trustScore: 4.7,
  },
  createdAt: '2023-06-10T08:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

const MOCK_BUYER_PROFILE: UserProfileDto = {
  userId: MOCK_USER_IDS.buyer,
  zaloId: MOCK_ZALO_IDS.buyer,
  role: 'buyer',
  displayName: 'Lê Minh Khoa',
  phone: '0934567890',
  avatarUrl: 'https://picsum.photos/seed/buyer001/64/64',
  buyerProfile: {
    organizationName: 'Chuỗi siêu thị Xanh Plus',
  },
  createdAt: '2024-03-20T09:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

const MOCK_GUEST_PROFILE: UserProfileDto = {
  userId: MOCK_USER_IDS.guest,
  zaloId: MOCK_ZALO_IDS.guest,
  role: 'guest',
  displayName: 'Khách trải nghiệm',
  phone: '0945678901',
  avatarUrl: 'https://picsum.photos/seed/guest001/64/64',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

// --------------- Role từ token giả (prefix) — dùng chung mockLogin & dev-login ─

export type MockAuthRole = 'farmer' | 'trader' | 'buyer' | 'guest';

/** Cùng quy tắc với mockLogin: guest… / trader… / buyer… / mặc định farmer. */
export function inferMockRoleFromToken(zaloAccessToken: string): MockAuthRole {
  return zaloAccessToken.startsWith('guest')
    ? 'guest'
    : zaloAccessToken.startsWith('trader')
      ? 'trader'
      : zaloAccessToken.startsWith('buyer')
        ? 'buyer'
        : 'farmer';
}

export function mockZaloIdForRole(role: MockAuthRole): string {
  return MOCK_ZALO_IDS[role];
}

// --------------- Mock service functions ---------------

/**
 * Simulates POST /api/v1/auth/login
 * Returns different roles based on the zaloAccessToken prefix for demo purposes:
 *   guest…, trader…, buyer…, mặc định farmer.
 */
export async function mockLogin(zaloAccessToken: string): Promise<LoginResponseDto> {
  const role: MockAuthRole = inferMockRoleFromToken(zaloAccessToken);

  const userId =
    role === 'guest'
      ? MOCK_USER_IDS.guest
      : role === 'trader'
        ? MOCK_USER_IDS.trader
        : role === 'buyer'
          ? MOCK_USER_IDS.buyer
          : MOCK_USER_IDS.farmer;

  return withMockDelay<LoginResponseDto>({
    accessToken: `mock.jwt.access.${role}.${Date.now()}`,
    refreshToken: `mock.jwt.refresh.${role}.${Date.now()}`,
    userId,
    role,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // +8h
  });
}

/**
 * Simulates POST /api/v1/auth/verify
 */
export async function mockVerify(userId: string, role: 'farmer' | 'trader' | 'buyer' | 'guest'): Promise<VerifyResponseDto> {
  return withMockDelay<VerifyResponseDto>({ userId, role, valid: true });
}

/**
 * Simulates POST /api/v1/auth/logout
 */
export async function mockLogout(): Promise<{ success: true }> {
  return withMockDelay({ success: true as const });
}

/**
 * Simulates GET /api/v1/auth/me
 * Returns profile matching the active mock role (default: farmer).
 */
export async function mockGetMe(role: 'farmer' | 'trader' | 'buyer' | 'guest' = 'farmer'): Promise<UserProfileDto> {
  const profiles: Record<string, UserProfileDto> = {
    farmer: MOCK_FARMER_PROFILE,
    trader: MOCK_TRADER_PROFILE,
    buyer: MOCK_BUYER_PROFILE,
    guest: MOCK_GUEST_PROFILE,
  };
  return withMockDelay(profiles[role] ?? MOCK_FARMER_PROFILE);
}

/**
 * Simulates PUT /api/v1/auth/me
 */
export async function mockUpdateMe(
  current: UserProfileDto,
  patch: Partial<Pick<UserProfileDto, 'displayName' | 'phone' | 'email' | 'avatarUrl' | 'traderProfile' | 'farmerProfile' | 'buyerProfile'>>,
): Promise<UserProfileDto> {
  return withMockDelay({ ...current, ...patch, lastLogin: current.lastLogin });
}
