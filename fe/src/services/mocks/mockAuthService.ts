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

// --------------- Mock data fixtures ---------------

const MOCK_FARMER_PROFILE: UserProfileDto = {
  userId: 'usr_farmer_001',
  zaloId: 'zalo_farmer_001',
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
  userId: 'usr_trader_001',
  zaloId: 'zalo_trader_001',
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
  userId: 'usr_buyer_001',
  zaloId: 'zalo_buyer_001',
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

// --------------- Mock service functions ---------------

/**
 * Simulates POST /api/v1/auth/login
 * Returns different roles based on the zaloAccessToken prefix for demo purposes.
 */
export async function mockLogin(zaloAccessToken: string): Promise<LoginResponseDto> {
  const role: 'farmer' | 'trader' | 'buyer' =
    zaloAccessToken.startsWith('trader') ? 'trader' :
    zaloAccessToken.startsWith('buyer')  ? 'buyer'  : 'farmer';

  const userId =
    role === 'trader' ? 'usr_trader_001' :
    role === 'buyer'  ? 'usr_buyer_001'  : 'usr_farmer_001';

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
    farmer:  MOCK_FARMER_PROFILE,
    trader:  MOCK_TRADER_PROFILE,
    buyer:   MOCK_BUYER_PROFILE,
    guest:   { ...MOCK_FARMER_PROFILE, role: 'guest', userId: 'usr_guest', displayName: 'Khách vãng lai' },
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
