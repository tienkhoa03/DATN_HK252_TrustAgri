/**
 * dashboardService — Contract Service (design.md §4.4.7)
 *
 *   GET /api/v1/dashboard/trader
 *   GET /api/v1/dashboard/farmer
 *   GET /api/v1/dashboard/buyer
 *
 * Bearer JWT do interceptor gắn từ Jotai (ZMP token sau login).
 * Response camelCase khớp @trustagri/shared DTO.
 */

import apiClient from '@/api/client';
import { ApiError, type ApiErrorCode } from '@/api/errors';

// ── DTO (camelCase — khớp be/libs/shared/src/dto/contract.dto.ts) ────────────

export interface DashboardTraderDto {
  periodFrom: string;
  periodTo: string;
  orderCountByStatus: Record<string, number>;
  demandTrend: Array<{ date: string; requestCount: number }>;
  topCrops: Array<{ cropType: string; volume: number }>;
  activeContracts: number;
  pendingConnections: number;
}

// FR-T02: xu hướng nhu cầu thị trường (GET /dashboard/trader/market-trends)
export interface MarketTrendDto {
  cropType: string;
  demand: number;
  supply: number;
  buyerCount: number;
  trend: 'up' | 'down' | 'stable';
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
  totalSpent?: number;
}

// ── Normalizers (phòng khi proxy/legacy trả snake_case) ──────────────────────

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v) || fallback;
  return fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function normalizeTrader(raw: unknown): DashboardTraderDto {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const demandRaw = o.demandTrend ?? o.demand_trend;
  const topRaw = o.topCrops ?? o.top_crops;
  const orderRaw = o.orderCountByStatus ?? o.order_count_by_status;

  const demandTrend = Array.isArray(demandRaw)
    ? demandRaw.map((row) => {
        const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        return {
          date: str(r.date).slice(0, 10),
          requestCount: num(r.requestCount ?? r.request_count),
        };
      })
    : [];

  const topCrops = Array.isArray(topRaw)
    ? topRaw.map((row) => {
        const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        return {
          cropType: str(r.cropType ?? r.crop_type),
          volume: num(r.volume),
        };
      })
    : [];

  const orderCountByStatus: Record<string, number> = {};
  if (orderRaw && typeof orderRaw === 'object' && !Array.isArray(orderRaw)) {
    for (const [k, v] of Object.entries(orderRaw as Record<string, unknown>)) {
      orderCountByStatus[k] = num(v);
    }
  }

  return {
    periodFrom: str(o.periodFrom ?? o.period_from),
    periodTo: str(o.periodTo ?? o.period_to),
    orderCountByStatus,
    demandTrend,
    topCrops,
    activeContracts: num(o.activeContracts ?? o.active_contracts),
    pendingConnections: num(o.pendingConnections ?? o.pending_connections),
  };
}

function normalizeFarmer(raw: unknown): DashboardFarmerDto {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    periodFrom: str(o.periodFrom ?? o.period_from),
    periodTo: str(o.periodTo ?? o.period_to),
    complianceScore: num(o.complianceScore ?? o.compliance_score),
    recentAlerts: num(o.recentAlerts ?? o.recent_alerts),
    activeContracts: num(o.activeContracts ?? o.active_contracts),
    careLogCount: num(o.careLogCount ?? o.care_log_count),
  };
}

function normalizeBuyer(raw: unknown): DashboardBuyerDto {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const summaryRaw = o.summary && typeof o.summary === 'object' ? (o.summary as Record<string, unknown>) : o;
  const rawSpent = summaryRaw.totalSpent ?? summaryRaw.total_spent ?? o.totalSpent ?? o.total_spent;
  return {
    periodFrom: str(o.periodFrom ?? o.period_from),
    periodTo: str(o.periodTo ?? o.period_to),
    openBuyingRequests: num(o.openBuyingRequests ?? o.open_buying_requests),
    pendingProposals: num(o.pendingProposals ?? o.pending_proposals),
    activeContracts: num(o.activeContracts ?? o.active_contracts),
    completedOrders: num(o.completedOrders ?? o.completed_orders),
    totalSpent: rawSpent !== undefined && rawSpent !== null ? num(rawSpent) : undefined,
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function fetchTraderDashboard(): Promise<DashboardTraderDto> {
  const { data } = await apiClient.get<unknown>('/dashboard/trader');
  return normalizeTrader(data);
}

export async function fetchTraderMarketTrends(): Promise<MarketTrendDto[]> {
  const { data } = await apiClient.get<unknown>('/dashboard/trader/market-trends');
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const t = r.trend;
    const trend: MarketTrendDto['trend'] =
      t === 'up' || t === 'down' || t === 'stable' ? t : 'stable';
    return {
      cropType: str(r.cropType ?? r.crop_type),
      demand: num(r.demand),
      supply: num(r.supply),
      buyerCount: num(r.buyerCount ?? r.buyer_count),
      trend,
    };
  });
}

export async function fetchFarmerDashboard(): Promise<DashboardFarmerDto> {
  const { data } = await apiClient.get<unknown>('/dashboard/farmer');
  return normalizeFarmer(data);
}

export async function fetchBuyerDashboard(): Promise<DashboardBuyerDto> {
  const { data } = await apiClient.get<unknown>('/dashboard/buyer');
  return normalizeBuyer(data);
}

// ── Lỗi tiếng Việt (ErrorResponse / ApiError) ─────────────────────────────────

export function toDashboardViMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const code = err.code as ApiErrorCode;
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền xem dashboard này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy dữ liệu dashboard.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Thử lại sau.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ.';
      default:
        return err.message || 'Không tải được dữ liệu dashboard.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Không tải được dữ liệu dashboard.';
}
