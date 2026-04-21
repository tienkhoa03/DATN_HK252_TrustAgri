import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
  IsObject,
} from 'class-validator';

// ─── PRODUCT ───────────────────────────────────────────────────────────────────

/**
 * Sản phẩm marketplace (design.md §4.4.1 ProductDto)
 */
export interface ProductDto {
  id: string;
  traderId: string;
  farmId?: string;
  name: string;
  cropType: string;
  unit: string;
  price: number;
  currency: 'VND';
  images: string[];
  standardCode?: string;
  stockQuantity?: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  farmId?: string;

  @IsString()
  name: string;

  @IsString()
  cropType: string;

  @IsString()
  unit: string;

  @IsNumber()
  price: number;

  @IsArray()
  images: string[];

  @IsOptional()
  @IsString()
  standardCode?: string;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// ─── BUYING REQUEST ────────────────────────────────────────────────────────────

/**
 * Nhu cầu mua hàng (design.md §4.4.2 BuyingRequestDto)
 */
export interface BuyingRequestDto {
  id: string;
  buyerId: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityStandardCode?: string;
  expectedPrice?: number;
  depositOffered?: number;
  deliveryDate: string;
  status: 'open' | 'matched' | 'closed';
  createdAt: string;
}

export class CreateBuyingRequestDto {
  @IsString()
  cropType: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  qualityStandardCode?: string;

  @IsOptional()
  @IsNumber()
  expectedPrice?: number;

  @IsOptional()
  @IsNumber()
  depositOffered?: number;

  @IsString()
  deliveryDate: string;
}

// ─── ORDER ─────────────────────────────────────────────────────────────────────

/**
 * Đơn hàng (design.md §4.4.3 OrderDto)
 */
export interface OrderDto {
  id: string;
  buyerId: string;
  traderId: string;
  productId: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  deposit?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'contracted' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export class CreateOrderDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  deposit?: number;
}

// ─── PROPOSAL ──────────────────────────────────────────────────────────────────

/**
 * Đề xuất phản hồi buying request (design.md §4.4.4 ProposalDto)
 */
export interface ProposalDto {
  id: string;
  buyingRequestId: string;
  traderId: string;
  price: number;
  quantity: number;
  standardCode?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export class CreateProposalDto {
  @IsString()
  buyingRequestId: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  standardCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── CONTRACT ──────────────────────────────────────────────────────────────────

/**
 * Hợp đồng (design.md §4.4.5 ContractDto)
 */
export interface ContractDto {
  id: string;
  partyFarmerId?: string;
  partyTraderId: string;
  partyBuyerId?: string;
  contractType: 'farmer_trader' | 'trader_buyer';
  productId?: string;
  standardId?: string;
  farmId?: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  deposit?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending_change' | 'completed' | 'cancelled';
  terms: string;
  createdAt: string;
}

export class CreateContractDto {
  @IsOptional()
  @IsString()
  partyFarmerId?: string;

  @IsString()
  partyTraderId: string;

  @IsOptional()
  @IsString()
  partyBuyerId?: string;

  @IsIn(['farmer_trader', 'trader_buyer'])
  contractType: 'farmer_trader' | 'trader_buyer';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  standardId?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  terms: string;
}

/**
 * Yêu cầu thay đổi hợp đồng (design.md §4.4.5 ContractChangeRequestDto)
 */
export interface ContractChangeRequestDto {
  id: string;
  contractId: string;
  requestedBy: string;
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedBy?: string;
  createdAt: string;
  respondedAt?: string;
}

export class CreateContractChangeRequestDto {
  /** Khóa là tên trường hợp đồng (camelCase); mỗi mục phải khớp giá trị hiện tại ở oldValue. */
  @IsObject()
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Kết quả tuân thủ quy trình (design.md §4.4.5 ComplianceDto)
 */
export interface ComplianceDto {
  contractId: string;
  standardCode: string;
  totalSteps: number;
  completedSteps: number;
  deviations: Array<{
    careLogId: string;
    stepId: string;
    reason: string;
    detectedAt: string;
  }>;
  complianceScore: number;
  lastComputedAt: string;
}

// ─── CONNECTION ────────────────────────────────────────────────────────────────

/**
 * Kết nối nông dân – thương lái (design.md §4.4.6 ConnectionDto)
 */
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
}

export class CreateConnectionDto {
  @IsString()
  toUserId: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────

/**
 * Dashboard thương lái (design.md §4.4.7 DashboardTraderDto)
 */
export interface DashboardTraderDto {
  periodFrom: string;
  periodTo: string;
  orderCountByStatus: Record<string, number>;
  demandTrend: Array<{ date: string; requestCount: number }>;
  topCrops: Array<{ cropType: string; volume: number }>;
  activeContracts: number;
  pendingConnections: number;
}

export interface DashboardFarmerDto {
  periodFrom: string;
  periodTo: string;
  complianceScore: number;
  recentAlerts: number;
  activeContracts: number;
  careLogCount: number;
}

export interface DashboardBuyerDto {
  periodFrom: string;
  periodTo: string;
  openBuyingRequests: number;
  pendingProposals: number;
  activeContracts: number;
  completedOrders: number;
}
