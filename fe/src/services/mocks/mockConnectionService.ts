/**
 * Mock Connection Service — Phase 8.1 (FR-F02, FR-F03, FR-T07, FR-T08)
 *
 * Giả lập tầng transport cho Connection endpoints — dùng khi BE chưa triển khai.
 * JSON khớp 1-1 với hợp đồng ConnectionDto trong
 * specs/backend-api-specification/design.md §4.4.6.
 *
 * Endpoints giả lập:
 *   GET  /api/v1/traders/search              → ListResponse<TraderSearchResultDto>
 *   GET  /api/v1/farmers/search              → ListResponse<FarmerSearchResultDto>
 *   GET  /api/v1/connections                 → ListResponse<ConnectionDto>
 *   POST /api/v1/connections                 → ConnectionDto
 *   POST /api/v1/connections/:id/accept      → ConnectionDto
 *   POST /api/v1/connections/:id/reject      → ConnectionDto
 */

import { withMockDelay } from './index';

// ── DTOs (camelCase, khớp hợp đồng backend) ──────────────────────────────────

export interface ConnectionDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromRole: 'farmer' | 'trader';
  toRole: 'farmer' | 'trader';
  farmId?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  /** UI helper — tên hiển thị của bên kia, không có trong hợp đồng gốc */
  counterpartName?: string;
  counterpartAvatar?: string;
}

/** Kết quả tìm thương lái (từ góc nhìn nông dân — GET /api/v1/traders/search) */
export interface TraderSearchResultDto {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  traderProfile: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  };
  /** Trạng thái kết nối hiện tại với nông dân đang đăng nhập */
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  connectionId?: string;
}

/** Kết quả tìm nông dân (từ góc nhìn thương lái — GET /api/v1/farmers/search) */
export interface FarmerSearchResultDto {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  farmerProfile: {
    region: string;
    experienceYears: number;
  };
  farms: Array<{ id: string; name: string; cropType: string; area: number }>;
  /** Trạng thái kết nối hiện tại với thương lái đang đăng nhập */
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  connectionId?: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SearchTradersParams {
  region?: string;
  cropType?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface SearchFarmersParams {
  region?: string;
  cropType?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface ListConnectionsParams {
  role?: 'incoming' | 'outgoing' | 'all';
  status?: 'pending' | 'accepted' | 'rejected' | 'all';
  page?: number;
  limit?: number;
}

export interface CreateConnectionDto {
  toUserId: string;
  farmId?: string;
  message?: string;
}

// ── Mock data stores ──────────────────────────────────────────────────────────

const MOCK_TRADERS: TraderSearchResultDto[] = [
  {
    userId: 'trader-001',
    displayName: 'Công ty TNHH Trái cây Miền Nam',
    traderProfile: {
      companyName: 'Công ty TNHH Trái cây Miền Nam',
      region: 'TP. Hồ Chí Minh',
      capacity: '500 tấn/tháng',
      trustScore: 95,
    },
    connectionStatus: 'pending_received',
    connectionId: 'conn-001',
  },
  {
    userId: 'trader-002',
    displayName: 'Hợp tác xã Nông sản Đồng Tháp',
    traderProfile: {
      companyName: 'Hợp tác xã Nông sản Đồng Tháp',
      region: 'Đồng Tháp',
      capacity: '200 tấn/tháng',
      trustScore: 88,
    },
    connectionStatus: 'pending_received',
    connectionId: 'conn-002',
  },
  {
    userId: 'trader-003',
    displayName: 'Thương lái Nguyễn Văn A',
    traderProfile: {
      companyName: 'Hộ kinh doanh Nguyễn Văn A',
      region: 'Tiền Giang',
      capacity: '80 tấn/tháng',
      trustScore: 92,
    },
    connectionStatus: 'none',
  },
  {
    userId: 'trader-004',
    displayName: 'Công ty Xuất khẩu Trái cây Việt',
    traderProfile: {
      companyName: 'Công ty CP Xuất khẩu Trái cây Việt',
      region: 'Bến Tre',
      capacity: '1000 tấn/tháng',
      trustScore: 85,
    },
    connectionStatus: 'none',
  },
  {
    userId: 'trader-005',
    displayName: 'Hợp tác xã Nông dân Vĩnh Long',
    traderProfile: {
      companyName: 'HTX Nông dân Vĩnh Long',
      region: 'Vĩnh Long',
      capacity: '120 tấn/tháng',
      trustScore: 78,
    },
    connectionStatus: 'accepted',
    connectionId: 'conn-005',
  },
  {
    userId: 'trader-006',
    displayName: 'Tổng công ty Lương thực Miền Nam',
    traderProfile: {
      companyName: 'Vinafood 2',
      region: 'TP. Hồ Chí Minh',
      capacity: '5000 tấn/tháng',
      trustScore: 97,
    },
    connectionStatus: 'pending_sent',
    connectionId: 'conn-006',
  },
];

const MOCK_FARMERS: FarmerSearchResultDto[] = [
  {
    userId: 'farmer-001',
    displayName: 'Tiến Khoa',
    farmerProfile: { region: 'Tiền Giang', experienceYears: 10 },
    farms: [
      { id: 'farm-001', name: 'Farm Lab Đông A', cropType: 'dragon_fruit', area: 25000 },
    ],
    connectionStatus: 'accepted',
    connectionId: 'conn-f-001',
  },
  {
    userId: 'farmer-002',
    displayName: 'Văn Minh',
    farmerProfile: { region: 'Bến Tre', experienceYears: 7 },
    farms: [
      { id: 'farm-002', name: 'Vườn Bưởi Da Xanh', cropType: 'pomelo', area: 15000 },
    ],
    connectionStatus: 'accepted',
    connectionId: 'conn-f-002',
  },
  {
    userId: 'farmer-003',
    displayName: 'Thanh Tùng',
    farmerProfile: { region: 'Đồng Tháp', experienceYears: 5 },
    farms: [
      { id: 'farm-003', name: 'Vườn Xoài Cát Chu', cropType: 'mango', area: 30000 },
    ],
    connectionStatus: 'none',
  },
  {
    userId: 'farmer-004',
    displayName: 'Hoàng Nam',
    farmerProfile: { region: 'Hà Giang', experienceYears: 5 },
    farms: [
      { id: 'farm-004', name: 'Cam Sành Hà Giang', cropType: 'orange', area: 10000 },
    ],
    connectionStatus: 'pending_received',
    connectionId: 'conn-f-004',
  },
  {
    userId: 'farmer-005',
    displayName: 'Thị Lan',
    farmerProfile: { region: 'Hưng Yên', experienceYears: 8 },
    farms: [
      { id: 'farm-005', name: 'Nhãn Lồng Hưng Yên', cropType: 'longan', area: 8000 },
    ],
    connectionStatus: 'pending_received',
    connectionId: 'conn-f-005',
  },
  {
    userId: 'farmer-006',
    displayName: 'Minh Tuấn',
    farmerProfile: { region: 'Long An', experienceYears: 12 },
    farms: [
      { id: 'farm-006', name: 'Thanh Long Ruột Đỏ Long An', cropType: 'dragon_fruit', area: 20000 },
    ],
    connectionStatus: 'none',
  },
];

/** Store kết nối có thể mutate khi accept/reject/create */
let MOCK_CONNECTIONS: ConnectionDto[] = [
  // Farmer gửi cho trader (outgoing từ góc nông dân / incoming từ góc thương lái)
  {
    id: 'conn-006',
    fromUserId: 'user-farmer-001',
    toUserId: 'trader-006',
    fromRole: 'farmer',
    toRole: 'trader',
    message: 'Tôi muốn hợp tác cung cấp sầu riêng Monthong cho quý công ty.',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Tổng công ty Lương thực Miền Nam',
  },
  // Trader gửi cho farmer (incoming từ góc nông dân / outgoing từ góc thương lái)
  {
    id: 'conn-001',
    fromUserId: 'trader-001',
    toUserId: 'user-farmer-001',
    fromRole: 'trader',
    toRole: 'farmer',
    message: 'Chúng tôi muốn thu mua sầu riêng chất lượng cao từ vườn của bạn.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Công ty TNHH Trái cây Miền Nam',
  },
  {
    id: 'conn-002',
    fromUserId: 'trader-002',
    toUserId: 'user-farmer-001',
    fromRole: 'trader',
    toRole: 'farmer',
    message: 'HTX chúng tôi đang mở rộng thu mua, mong được hợp tác lâu dài.',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Hợp tác xã Nông sản Đồng Tháp',
  },
  // Đã chấp nhận
  {
    id: 'conn-005',
    fromUserId: 'user-farmer-001',
    toUserId: 'trader-005',
    fromRole: 'farmer',
    toRole: 'trader',
    status: 'accepted',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Hợp tác xã Nông dân Vĩnh Long',
  },
  // Từ góc thương lái
  {
    id: 'conn-f-001',
    fromUserId: 'trader-001',
    toUserId: 'farmer-001',
    fromRole: 'trader',
    toRole: 'farmer',
    status: 'accepted',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Tiến Khoa',
  },
  {
    id: 'conn-f-002',
    fromUserId: 'trader-001',
    toUserId: 'farmer-002',
    fromRole: 'trader',
    toRole: 'farmer',
    status: 'accepted',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Văn Minh',
  },
  {
    id: 'conn-f-004',
    fromUserId: 'farmer-004',
    toUserId: 'trader-001',
    fromRole: 'farmer',
    toRole: 'trader',
    message: 'Tôi có vườn cam sành Hà Giang, muốn tìm đầu ra ổn định.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Hoàng Nam',
  },
  {
    id: 'conn-f-005',
    fromUserId: 'farmer-005',
    toUserId: 'trader-001',
    fromRole: 'farmer',
    toRole: 'trader',
    message: 'Vườn nhãn lồng Hưng Yên đặc sản, muốn hợp tác tiêu thụ.',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    counterpartName: 'Thị Lan',
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

const CROP_LABELS: Record<string, string> = {
  dragon_fruit: 'Thanh long',
  pomelo: 'Bưởi',
  mango: 'Xoài',
  orange: 'Cam',
  longan: 'Nhãn',
  durian: 'Sầu riêng',
  lychee: 'Vải',
  banana: 'Chuối',
  rambutan: 'Chôm chôm',
};

export function cropLabel(cropType: string): string {
  return CROP_LABELS[cropType] ?? cropType;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Giả lập GET /api/v1/traders/search
 * Nông dân tìm kiếm thương lái để gửi yêu cầu kết nối.
 */
export async function searchTraders(
  params?: SearchTradersParams,
): Promise<ListResponse<TraderSearchResultDto>> {
  let results = [...MOCK_TRADERS];

  const kw = params?.keyword?.toLowerCase();
  if (kw) {
    results = results.filter(
      (t) =>
        t.displayName.toLowerCase().includes(kw) ||
        t.traderProfile.companyName.toLowerCase().includes(kw) ||
        t.traderProfile.region.toLowerCase().includes(kw),
    );
  }
  if (params?.region && params.region !== 'all') {
    results = results.filter((t) =>
      t.traderProfile.region.includes(params.region!),
    );
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const items = results.slice((page - 1) * limit, page * limit);

  return withMockDelay({ items, page, limit, total: results.length });
}

/**
 * Giả lập GET /api/v1/farmers/search
 * Thương lái tìm nông dân cung cấp nguồn hàng.
 */
export async function searchFarmers(
  params?: SearchFarmersParams,
): Promise<ListResponse<FarmerSearchResultDto>> {
  let results = [...MOCK_FARMERS];

  const kw = params?.keyword?.toLowerCase();
  if (kw) {
    results = results.filter(
      (f) =>
        f.displayName.toLowerCase().includes(kw) ||
        f.farmerProfile.region.toLowerCase().includes(kw) ||
        f.farms.some(
          (farm) =>
            farm.name.toLowerCase().includes(kw) ||
            cropLabel(farm.cropType).toLowerCase().includes(kw),
        ),
    );
  }
  if (params?.region && params.region !== 'all') {
    results = results.filter((f) =>
      f.farmerProfile.region.includes(params.region!),
    );
  }
  if (params?.cropType && params.cropType !== 'all') {
    results = results.filter((f) =>
      f.farms.some((farm) => farm.cropType === params.cropType),
    );
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const items = results.slice((page - 1) * limit, page * limit);

  return withMockDelay({ items, page, limit, total: results.length });
}

/**
 * Giả lập GET /api/v1/connections
 * Lọc theo role (incoming/outgoing) và status.
 * `currentUserId` mô phỏng người dùng đang đăng nhập.
 */
export async function listConnections(
  currentUserId: string,
  params?: ListConnectionsParams,
): Promise<ListResponse<ConnectionDto>> {
  let results = [...MOCK_CONNECTIONS];

  if (params?.role === 'incoming') {
    results = results.filter((c) => c.toUserId === currentUserId);
  } else if (params?.role === 'outgoing') {
    results = results.filter((c) => c.fromUserId === currentUserId);
  } else {
    results = results.filter(
      (c) => c.fromUserId === currentUserId || c.toUserId === currentUserId,
    );
  }

  if (params?.status && params.status !== 'all') {
    results = results.filter((c) => c.status === params.status);
  }

  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const items = results.slice((page - 1) * limit, page * limit);

  return withMockDelay({ items, page, limit, total: results.length });
}

/**
 * Giả lập POST /api/v1/connections
 * Tạo yêu cầu kết nối mới.
 */
export async function createConnection(
  fromUserId: string,
  fromRole: 'farmer' | 'trader',
  body: CreateConnectionDto,
): Promise<ConnectionDto> {
  const toRole: 'farmer' | 'trader' = fromRole === 'farmer' ? 'trader' : 'farmer';
  const newConn: ConnectionDto = {
    id: `conn-${Date.now()}`,
    fromUserId,
    toUserId: body.toUserId,
    fromRole,
    toRole,
    farmId: body.farmId,
    message: body.message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  MOCK_CONNECTIONS = [newConn, ...MOCK_CONNECTIONS];

  // Cập nhật connectionStatus trong MOCK_TRADERS hoặc MOCK_FARMERS
  if (fromRole === 'farmer') {
    const trader = MOCK_TRADERS.find((t) => t.userId === body.toUserId);
    if (trader) {
      trader.connectionStatus = 'pending_sent';
      trader.connectionId = newConn.id;
    }
  } else {
    const farmer = MOCK_FARMERS.find((f) => f.userId === body.toUserId);
    if (farmer) {
      farmer.connectionStatus = 'pending_sent';
      farmer.connectionId = newConn.id;
    }
  }

  return withMockDelay(newConn);
}

/**
 * Giả lập POST /api/v1/connections/:id/accept
 */
export async function acceptConnection(connectionId: string): Promise<ConnectionDto> {
  const conn = MOCK_CONNECTIONS.find((c) => c.id === connectionId);
  if (!conn) throw new Error('Connection not found');
  conn.status = 'accepted';
  conn.respondedAt = new Date().toISOString();

  // Cập nhật search results
  const trader = MOCK_TRADERS.find((t) => t.connectionId === connectionId);
  if (trader) trader.connectionStatus = 'accepted';
  const farmer = MOCK_FARMERS.find((f) => f.connectionId === connectionId);
  if (farmer) farmer.connectionStatus = 'accepted';

  return withMockDelay({ ...conn });
}

/**
 * Giả lập POST /api/v1/connections/:id/reject
 */
export async function rejectConnection(connectionId: string): Promise<ConnectionDto> {
  const conn = MOCK_CONNECTIONS.find((c) => c.id === connectionId);
  if (!conn) throw new Error('Connection not found');
  conn.status = 'rejected';
  conn.respondedAt = new Date().toISOString();

  const trader = MOCK_TRADERS.find((t) => t.connectionId === connectionId);
  if (trader) { trader.connectionStatus = 'none'; trader.connectionId = undefined; }
  const farmer = MOCK_FARMERS.find((f) => f.connectionId === connectionId);
  if (farmer) { farmer.connectionStatus = 'none'; farmer.connectionId = undefined; }

  return withMockDelay({ ...conn });
}
