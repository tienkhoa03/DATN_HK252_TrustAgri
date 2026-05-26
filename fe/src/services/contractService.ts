/**
 * contractService — Contract Service qua API Gateway (design.md §4.4.5)
 *
 *   GET    /api/v1/contracts
 *   GET    /api/v1/contracts/:id
 *   GET    /api/v1/contracts/:id/audit-logs
 *   GET    /api/v1/contracts/:id/compliance  (FR-T11)
 *   POST   /api/v1/contracts   (trader | admin)
 *   POST   /api/v1/contracts/:id/reject
 *
 * JWT: Authorization Bearer từ interceptor; `role` trong query phải khớp vai trò tài khoản (BE).
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';
import type { BuyerTransactionSummaryDto } from '@/services/orderService';
import {
  partyBuyerDisplay,
  partyFarmerDisplay,
  partyTraderDisplay,
  userDisplayLabel,
} from '@/utils/displayLabels';

export { partyFarmerDisplay, partyBuyerDisplay, partyTraderDisplay };

export interface ContractDto {
  id: string;
  partyFarmerId?: string;
  partyTraderId: string;
  partyBuyerId?: string;
  partyFarmerName?: string | null;
  partyFarmerPhone?: string | null;
  partyTraderName?: string | null;
  partyTraderPhone?: string | null;
  partyBuyerName?: string | null;
  partyBuyerPhone?: string | null;
  contractType: 'farmer_trader' | 'trader_buyer';
  productId?: string;
  sourceContractId?: string;
  standardId?: string;
  standardName?: string | null;
  farmId?: string;
  farmName?: string | null;
  quantity: number;
  unit: string;
  totalPrice: number;
  deposit?: number;
  startDate: string;
  endDate: string;
  plantingDate?: string | null;
  status: 'pending_signature' | 'active' | 'pending_change' | 'in_settlement' | 'completed' | 'cancelled';
  terms: string;
  farmerSignedAt?: string;
  traderSignedAt?: string;
  buyerSignedAt?: string;
  /** Mã QR lô hàng truy xuất công khai (chỉ có ở farmer_trader contract đã active). Format `LOT-…`. */
  traceabilityCode?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContractAuditLogDto {
  id: string;
  contractId: string;
  previousStatus: string | null;
  newStatus: string;
  actorUserId: string;
  occurredAt: string;
}

/** design.md §4.4.5 ComplianceDto */
export interface ComplianceDeviationDto {
  careLogId: string;
  stepId: string;
  reason: string;
  detectedAt: string;
}

export interface ComplianceDto {
  contractId: string;
  standardCode: string;
  totalSteps: number;
  completedSteps: number;
  deviations: ComplianceDeviationDto[];
  /** 0..1 */
  complianceScore: number;
  lastComputedAt: string;
}

function normalizeComplianceDeviation(raw: unknown): ComplianceDeviationDto {
  const r = raw as Record<string, unknown>;
  return {
    careLogId: String(r.careLogId ?? r.care_log_id ?? ''),
    stepId: String(r.stepId ?? r.step_id ?? ''),
    reason: String(r.reason ?? ''),
    detectedAt: String(r.detectedAt ?? r.detected_at ?? ''),
  };
}

/** Chuẩn hóa payload từ Nest (camelCase mặc định; phòng snake_case). */
export function normalizeComplianceDto(raw: unknown): ComplianceDto {
  const r = raw as Record<string, unknown>;
  const deviationsRaw = r.deviations;
  const deviations = Array.isArray(deviationsRaw)
    ? deviationsRaw.map(normalizeComplianceDeviation)
    : [];
  return {
    contractId: String(r.contractId ?? r.contract_id ?? ''),
    standardCode: String(r.standardCode ?? r.standard_code ?? ''),
    totalSteps: Number(r.totalSteps ?? r.total_steps ?? 0),
    completedSteps: Number(r.completedSteps ?? r.completed_steps ?? 0),
    deviations,
    complianceScore: Number(r.complianceScore ?? r.compliance_score ?? 0),
    lastComputedAt: String(r.lastComputedAt ?? r.last_computed_at ?? ''),
  };
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  /** GET /contracts?includeSummary=true (Phase 19) */
  summary?: BuyerTransactionSummaryDto;
}

export type ContractRoleFilter = 'farmer' | 'trader' | 'buyer';

export interface ListContractsParams {
  role?: ContractRoleFilter;
  /** `me` = partyBuyerId = user hiện tại (role buyer) */
  buyerId?: string;
  status?: ContractDto['status'] | 'all';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  includeSummary?: boolean;
}

export interface CreateContractDto {
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
  plantingDate?: string;
  terms: string;
}

function normalizeContract(raw: ContractDto): ContractDto {
  const r = raw as unknown as Record<string, unknown>;
  return {
    ...raw,
    farmName:
      raw.farmName ??
      (typeof r.farm_name === 'string' ? r.farm_name : null) ??
      null,
    standardName:
      raw.standardName ??
      (typeof r.standard_name === 'string' ? r.standard_name : null) ??
      null,
    quantity: Number(raw.quantity),
    totalPrice: Number(raw.totalPrice),
    deposit: raw.deposit != null ? Number(raw.deposit) : undefined,
    traceabilityCode:
      raw.traceabilityCode ??
      (typeof r.traceability_code === 'string' ? r.traceability_code : null) ??
      null,
  };
}

export function contractStatusLabelVi(status: ContractDto['status']): string {
  switch (status) {
    case 'pending_signature':
      return 'Chờ ký';
    case 'active':
      return 'Đang thực hiện';
    case 'pending_change':
      return 'Chờ duyệt thay đổi';
    case 'in_settlement':
      return 'Đang quyết toán';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return String(status);
  }
}

export function contractTypeLabelVi(t: ContractDto['contractType']): string {
  return t === 'farmer_trader' ? 'Nông dân — Thương lái' : 'Thương lái — Người mua';
}

/** Hiển thị nông dân — truyền partyFarmerName khi có từ BE. */
export function partyFarmerLabel(
  farmerId: string,
  name?: string | null,
  phone?: string | null,
): string {
  return userDisplayLabel(name, farmerId, 'Nông dân', phone);
}

/** Hiển thị người mua — truyền partyBuyerName khi có từ BE. */
export function partyBuyerLabel(
  buyerId: string,
  name?: string | null,
  phone?: string | null,
): string {
  return userDisplayLabel(name, buyerId, 'Người mua', phone);
}

/** Hiển thị thương lái — truyền partyTraderName khi có từ BE. */
export function partyTraderLabel(
  traderId: string,
  name?: string | null,
  phone?: string | null,
): string {
  return userDisplayLabel(name, traderId, 'Thương lái', phone);
}

type ContractCtx = 'list' | 'get' | 'create' | 'audit' | 'compliance' | 'reject' | 'sign';

export function toContractViMessage(err: unknown, context: ContractCtx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này với hợp đồng.';
      case 'NOT_FOUND':
        return 'Không tìm thấy hợp đồng.';
      case 'CONFLICT':
        if (context === 'create') {
          return (
            err.message?.trim() ||
            'Vườn đã có hợp đồng đang thực hiện. Mỗi vườn chỉ được có một hợp đồng tại một thời điểm.'
          );
        }
        return 'Trạng thái hợp đồng đã thay đổi. Vui lòng tải lại.';
      case 'INVALID_INPUT':
        return err.message?.trim() || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      case 'INTERNAL_ERROR':
        return err.message?.trim() || 'Lỗi máy chủ. Vui lòng thử lại sau.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<ContractCtx, string> = {
    list: 'Không thể tải danh sách hợp đồng.',
    get: 'Không thể tải chi tiết hợp đồng.',
    create: 'Không thể tạo hợp đồng.',
    audit: 'Không thể tải nhật ký hợp đồng.',
    compliance: 'Không thể tải dữ liệu tuân thủ quy trình.',
    reject: 'Không thể từ chối hợp đồng.',
    sign: 'Không thể ký hợp đồng.',
  };
  return fallback[context];
}

function normalizeSummary(raw: unknown): BuyerTransactionSummaryDto | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const s = raw as Record<string, unknown>;
  return {
    totalSpent: Number(s.totalSpent ?? s.total_spent ?? 0),
    completedCount: Number(s.completedCount ?? s.completed_count ?? 0),
  };
}

function normalizeListContractsResponse(raw: unknown): ListResponse<ContractDto> {
  const d = raw as Record<string, unknown>;
  const itemsRaw = d.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map((x) => normalizeContract(x as ContractDto)) : [];
  return {
    items,
    page: Number(d.page ?? 1),
    limit: Number(d.limit ?? 20),
    total: Number(d.total ?? 0),
    ...(d.summary != null ? { summary: normalizeSummary(d.summary) } : {}),
  };
}

export async function listContracts(params?: ListContractsParams): Promise<ListResponse<ContractDto>> {
  const q: Record<string, unknown> = {};
  if (params?.role) q.role = params.role;
  if (params?.buyerId) q.buyerId = params.buyerId;
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;
  if (params?.includeSummary === true) q.includeSummary = true;

  const { data } = await apiClient.get<unknown>('/contracts', { params: q });
  return normalizeListContractsResponse(data);
}

export async function getContract(id: string): Promise<ContractDto> {
  const { data } = await apiClient.get<ContractDto>(`/contracts/${id}`);
  return normalizeContract(data);
}

export async function createContract(body: CreateContractDto): Promise<ContractDto> {
  const { data } = await apiClient.post<ContractDto>('/contracts', body);
  return normalizeContract(data);
}

export async function listContractAuditLogs(contractId: string): Promise<ContractAuditLogDto[]> {
  const { data } = await apiClient.get<ContractAuditLogDto[]>(`/contracts/${contractId}/audit-logs`);
  return Array.isArray(data) ? data : [];
}

/** GET /api/v1/contracts/:id/compliance — FR-T11 */
export async function getContractCompliance(contractId: string): Promise<ComplianceDto> {
  const { data } = await apiClient.get<unknown>(`/contracts/${contractId}/compliance`);
  return normalizeComplianceDto(data);
}

/** PATCH /api/v1/contracts/:id/sign — ký hợp đồng (farmer/trader/buyer). */
export async function signContract(contractId: string): Promise<ContractDto> {
  const { data } = await apiClient.patch<ContractDto>(`/contracts/${contractId}/sign`);
  return normalizeContract(data);
}

/** POST /api/v1/contracts/:id/reject — từ chối hợp đồng chờ ký (bên chưa ký). */
export async function rejectContract(contractId: string, reason?: string): Promise<ContractDto> {
  const body = reason?.trim() ? { reason: reason.trim() } : {};
  const { data } = await apiClient.post<ContractDto>(`/contracts/${contractId}/reject`, body);
  return normalizeContract(data);
}

/** Kiểm tra user (theo userId + role) đã ký hợp đồng chưa. */
export function hasUserSigned(contract: ContractDto, userId: string, role: 'farmer' | 'trader' | 'buyer'): boolean {
  if (role === 'farmer') return contract.farmerSignedAt != null;
  if (role === 'trader') return contract.traderSignedAt != null;
  if (role === 'buyer') return contract.buyerSignedAt != null;
  return false;
}

/**
 * GET /api/v1/contracts?role=trader&status=active — lọc farmer_trader đang active.
 * Dùng để chọn nguồn gốc khi tạo sản phẩm / đề xuất.
 */
export async function listTraderActiveFarmerContracts(): Promise<ContractDto[]> {
  const res = await listContracts({ role: 'trader', status: 'active', limit: 100 });
  return res.items.filter((c) => c.contractType === 'farmer_trader');
}

/** Kiểm tra user có phải là bên trong hợp đồng và được phép ký không. */
export function canUserSign(contract: ContractDto, userId: string, role: 'farmer' | 'trader' | 'buyer'): boolean {
  if (contract.status !== 'pending_signature') return false;
  if (role === 'farmer') return contract.partyFarmerId === userId && !contract.farmerSignedAt;
  if (role === 'trader') return contract.partyTraderId === userId && !contract.traderSignedAt;
  if (role === 'buyer') return contract.partyBuyerId === userId && !contract.buyerSignedAt;
  return false;
}
