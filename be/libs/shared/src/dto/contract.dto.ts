import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
  IsObject,
  IsUUID,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── PRODUCT ───────────────────────────────────────────────────────────────────

/**
 * Sản phẩm marketplace (design.md §4.4.1 ProductDto)
 */
export interface ProductDto {
  id: string;
  traderId: string;
  farmId?: string;
  traderDisplayName?: string | null;
  traderPhone?: string | null;
  farmName?: string | null;
  farmTraceabilityCode?: string;
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
  sourceContractId?: string;
  standardId?: string;
  standardName?: string | null;
}

export class CreateProductDto {
  @ApiPropertyOptional({ description: 'Active farmer_trader contract ID that links to the farm (optional — bỏ trống nếu chưa có hợp đồng)', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsUUID('4')
  sourceContractId?: string;

  @ApiProperty({ description: 'Product name', example: 'Gao ST25 An Giang' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Crop type', example: 'rice' })
  @IsString()
  cropType: string;

  @ApiProperty({ description: 'Unit of sale', example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Price per unit in VND', example: 25000 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Product image URLs (optional — mặc định []) ', example: ['https://cdn.example.com/img1.jpg'] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ description: 'Quality standard code', example: 'VietGAP-Rice-2024' })
  @IsOptional()
  @IsString()
  standardCode?: string;

  @ApiPropertyOptional({ description: 'Available stock quantity', example: 500 })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Product description', example: 'Premium fragrant rice from Mekong Delta' })
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
  buyerDisplayName?: string | null;
  buyerPhone?: string | null;
  cropType: string;
  quantity: number;
  unit: string;
  qualityStandardCode?: string;
  expectedPrice?: number;
  depositOffered?: number;
  deliveryDate: string;
  description?: string;
  status: 'open' | 'matched' | 'closed';
  createdAt: string;
}

export class CreateBuyingRequestDto {
  @ApiProperty({ description: 'Desired crop type', example: 'rice' })
  @IsString()
  cropType: string;

  @ApiProperty({ description: 'Quantity needed', example: 1000 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit of quantity', example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Preferred quality standard code', example: 'VietGAP-Rice-2024' })
  @IsOptional()
  @IsString()
  qualityStandardCode?: string;

  @ApiPropertyOptional({ description: 'Expected price per unit in VND', example: 22000 })
  @IsOptional()
  @IsNumber()
  expectedPrice?: number;

  @ApiPropertyOptional({ description: 'Deposit amount offered in VND', example: 5000000 })
  @IsOptional()
  @IsNumber()
  depositOffered?: number;

  @ApiProperty({ description: 'Required delivery date (ISO 8601)', example: '2024-06-30' })
  @IsString()
  deliveryDate: string;

  @ApiPropertyOptional({ description: 'Additional requirements or description', example: 'Prefer organic, no pesticides 30 days before harvest', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

// ─── ORDER ─────────────────────────────────────────────────────────────────────

/**
 * Đơn hàng (design.md §4.4.3 OrderDto)
 */
export interface OrderDto {
  id: string;
  buyerId: string;
  traderId: string;
  buyerDisplayName?: string | null;
  buyerPhone?: string | null;
  traderDisplayName?: string | null;
  traderPhone?: string | null;
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
  @ApiProperty({ description: 'Product ID to purchase', example: 'a1b2c3d4-...' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity to order', example: 500 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit of quantity', example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Deposit amount in VND', example: 2000000 })
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
  farmId?: string;
  traderDisplayName?: string | null;
  traderPhone?: string | null;
  farmName?: string | null;
  price: number;
  quantity: number;
  standardCode?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  sourceContractId?: string;
  standardId?: string;
  standardName?: string | null;
}

export class CreateProposalDto {
  @ApiProperty({ description: 'Buying request ID this proposal responds to', example: 'a1b2c3d4-...' })
  @IsString()
  buyingRequestId: string;

  @ApiProperty({ description: 'Active farmer_trader contract ID', example: 'a1b2c3d4-...' })
  @IsUUID('4')
  sourceContractId: string;

  @ApiProperty({ description: 'Proposed price per unit in VND', example: 23000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Proposed quantity', example: 1000 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Standard code of the product offered', example: 'VietGAP-Rice-2024' })
  @IsOptional()
  @IsString()
  standardCode?: string;

  @ApiPropertyOptional({ description: 'Additional note for the buyer', example: 'Can deliver within 7 days of signing' })
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
  sourceContractId?: string;
  partyFarmerName?: string | null;
  partyFarmerPhone?: string | null;
  partyTraderName?: string | null;
  partyTraderPhone?: string | null;
  partyBuyerName?: string | null;
  partyBuyerPhone?: string | null;
  contractType: 'farmer_trader' | 'trader_buyer';
  productId?: string;
  standardId?: string;
  farmId?: string;
  farmName?: string | null;
  standardName?: string | null;
  quantity: number;
  unit: string;
  totalPrice: number;
  deposit?: number;
  startDate: string;
  endDate: string;
  plantingDate?: string | null;
  status: 'pending_signature' | 'active' | 'pending_change' | 'in_settlement' | 'completed' | 'cancelled';
  terms: string;
  /** ISO timestamp — nông dân đã ký (farmer_trader contracts). */
  farmerSignedAt?: string;
  /** ISO timestamp — thương lái đã ký. */
  traderSignedAt?: string;
  /** ISO timestamp — người mua đã ký (trader_buyer contracts). */
  buyerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateContractDto {
  @ApiPropertyOptional({ description: 'Farmer party user ID', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  partyFarmerId?: string;

  @ApiProperty({ description: 'Trader party user ID', example: 'b2c3d4e5-...' })
  @IsString()
  partyTraderId: string;

  @ApiPropertyOptional({ description: 'Buyer party user ID', example: 'c3d4e5f6-...' })
  @IsOptional()
  @IsString()
  partyBuyerId?: string;

  @ApiProperty({ description: 'Contract type', enum: ['farmer_trader', 'trader_buyer'], example: 'farmer_trader' })
  @IsIn(['farmer_trader', 'trader_buyer'])
  contractType: 'farmer_trader' | 'trader_buyer';

  @ApiPropertyOptional({ description: 'Product ID associated with this contract', example: 'd4e5f6g7-...' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Standard ID applied', example: 'e5f6g7h8-...' })
  @IsOptional()
  @IsString()
  standardId?: string;

  @ApiPropertyOptional({ description: 'Farm ID linked to this contract', example: 'f6g7h8i9-...' })
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiProperty({ description: 'Contracted quantity', example: 5000 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit of quantity', example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Total contract value in VND', example: 115000000 })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Deposit amount in VND', example: 23000000 })
  @IsOptional()
  @IsNumber()
  deposit?: number;

  @ApiProperty({ description: 'Contract start date (ISO 8601)', example: '2024-04-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Contract end date (ISO 8601)', example: '2024-09-30' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Farm care-plan start date (ISO 8601 date)', example: '2024-04-01' })
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiProperty({ description: 'Contract terms and conditions', example: 'Delivery to warehouse, moisture < 14%, grade A only' })
  @IsString()
  terms: string;
}

/**
 * Yêu cầu thay đổi hợp đồng (design.md §4.4.5 ContractChangeRequestDto)
 * action:
 *   - 'modify': sửa các trường (changes phải có).
 *   - 'cancel': yêu cầu hủy hợp đồng (changes có thể rỗng).
 *   - 'complete': yêu cầu hoàn thành hợp đồng (changes có thể rỗng).
 * Tất cả đều cần đối tác accept trước khi áp dụng.
 */
export type ContractChangeAction = 'modify' | 'cancel' | 'complete';

export interface ContractChangeRequestDto {
  id: string;
  contractId: string;
  action: ContractChangeAction;
  requestedBy: string;
  requestedByName?: string | null;
  requestedByPhone?: string | null;
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedBy?: string;
  respondedByName?: string | null;
  respondedByPhone?: string | null;
  createdAt: string;
  respondedAt?: string;
}

export class CreateContractChangeRequestDto {
  @ApiPropertyOptional({
    description: 'Loại yêu cầu',
    enum: ['modify', 'cancel', 'complete'],
    example: 'modify',
  })
  @IsOptional()
  @IsIn(['modify', 'cancel', 'complete'])
  action?: ContractChangeAction;

  /** Khóa là tên trường hợp đồng (camelCase); mỗi mục phải khớp giá trị hiện tại ở oldValue. */
  @ApiPropertyOptional({
    description: 'Fields to change. Key is camelCase contract field name; each entry has oldValue and newValue. Required for action=modify; ignored for cancel/complete.',
    example: { quantity: { oldValue: 5000, newValue: 4500 } },
  })
  @IsOptional()
  @IsObject()
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>;

  @ApiPropertyOptional({ description: 'Reason for requesting the change', example: 'Crop yield lower than expected due to flooding' })
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
  fromUserName?: string | null;
  fromUserPhone?: string | null;
  toUserName?: string | null;
  toUserPhone?: string | null;
  fromRole: 'farmer' | 'trader';
  toRole: 'farmer' | 'trader';
  farmId?: string;
  farmName?: string | null;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
}

export class CreateConnectionDto {
  @ApiProperty({ description: 'User ID to send connection request to', example: 'a1b2c3d4-...' })
  @IsString()
  toUserId: string;

  @ApiPropertyOptional({ description: 'Farm ID to include in the connection (farmer initiating)', example: 'b2c3d4e5-...' })
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiPropertyOptional({ description: 'Introductory message to the recipient', example: 'I grow ST25 rice in An Giang, interested in a long-term partnership.' })
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
