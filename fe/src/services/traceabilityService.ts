/**
 * Traceability (FR-G01) — GET /api/v1/traceability/qr/:code
 * Public: dùng skipAuth để không gửi Bearer dù phiên Zalo có token (design.md).
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO (camelCase — khớp specs/backend-api-specification/design.md) ───────

export interface TraceabilityFarmLocationDto {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

export interface TraceabilityFarmDto {
  id: string;
  name: string;
  location: TraceabilityFarmLocationDto;
  cropType: string;
}

export interface TraceabilityStandardDto {
  code: string;
  name: string;
}

export interface TraceabilityCareLogTimelineItemDto {
  action: string;
  standardStepTitle?: string;
  performedAt: string;
  notes?: string;
}

export interface TraceabilitySensorChartPointDto {
  t: string;
  value: number;
}

export interface TraceabilitySensorChartSeriesDto {
  sensorType: string;
  series: TraceabilitySensorChartPointDto[];
}

export interface TraceabilityContractDto {
  id: string;
  contractType: 'farmer_trader' | 'trader_buyer';
  status: string;
  productName?: string | null;
  quantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  plantingDate?: string | null;
  signedAt?: string | null;
  sourceContractId?: string | null;
}

export interface TraceabilityPartyDto {
  name?: string | null;
  phone?: string | null;
}

export interface TraceabilityDto {
  productCode: string;
  contract?: TraceabilityContractDto;
  farmer?: TraceabilityPartyDto;
  trader?: TraceabilityPartyDto;
  buyer?: TraceabilityPartyDto;
  farm: TraceabilityFarmDto;
  standard?: TraceabilityStandardDto;
  careLogTimeline: TraceabilityCareLogTimelineItemDto[];
  sensorChart: TraceabilitySensorChartSeriesDto[];
}

// ── Mapper (chấp nhận camelCase chuẩn hoặc snake_case nếu proxy/serializer đổi) ─

function val<T>(obj: Record<string, unknown>, camel: string, snake: string): T | undefined {
  const raw = obj[camel] ?? obj[snake];
  return raw as T | undefined;
}

function mapLocation(raw: unknown): TraceabilityFarmLocationDto {
  if (!raw || typeof raw !== 'object') {
    return { province: '', district: '', addressLine: '' };
  }
  const o = raw as Record<string, unknown>;
  return {
    province: String(val(o, 'province', 'province') ?? ''),
    district: String(val(o, 'district', 'district') ?? ''),
    addressLine: String(val(o, 'addressLine', 'address_line') ?? ''),
    lat: val<number | undefined>(o, 'lat', 'lat'),
    lng: val<number | undefined>(o, 'lng', 'lng'),
  };
}

function mapFarm(raw: unknown): TraceabilityFarmDto {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('INVALID_INPUT', 'Thiếu thông tin vườn trong phản hồi truy xuất.', 500);
  }
  const o = raw as Record<string, unknown>;
  const id = val<string>(o, 'id', 'id');
  const name = val<string>(o, 'name', 'name');
  const cropType = val<string>(o, 'cropType', 'crop_type');
  if (!id || !name || cropType === undefined) {
    throw new ApiError('INVALID_INPUT', 'Dữ liệu vườn không đầy đủ.', 500);
  }
  return {
    id,
    name,
    cropType,
    location: mapLocation(o.location),
  };
}

function mapStandard(raw: unknown): TraceabilityStandardDto | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const code = val<string>(o, 'code', 'code');
  const name = val<string>(o, 'name', 'name');
  if (!code || !name) return undefined;
  return { code, name };
}

function mapCareItem(raw: unknown): TraceabilityCareLogTimelineItemDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const action = val<string>(o, 'action', 'action');
  const performedAt = val<string>(o, 'performedAt', 'performed_at');
  if (!action || !performedAt) return null;
  const notes = val<string | undefined>(o, 'notes', 'notes');
  const standardStepTitle = val<string | undefined>(o, 'standardStepTitle', 'standard_step_title');
  return { action, standardStepTitle, performedAt, notes };
}

function mapSeriesPoint(raw: unknown): TraceabilitySensorChartPointDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const t = val<string>(o, 't', 't') ?? val<string>(o, 'time', 'time');
  const valueRaw = val<number | string>(o, 'value', 'value');
  if (!t || valueRaw === undefined || valueRaw === null) return null;
  const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
  if (Number.isNaN(value)) return null;
  return { t, value };
}

function mapSensorSeries(raw: unknown): TraceabilitySensorChartSeriesDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const sensorType = val<string>(o, 'sensorType', 'sensor_type');
  const seriesRaw = val<unknown[]>(o, 'series', 'series');
  if (!sensorType || !Array.isArray(seriesRaw)) return null;
  const series = seriesRaw.map(mapSeriesPoint).filter(Boolean) as TraceabilitySensorChartPointDto[];
  return { sensorType, series };
}

function mapContract(raw: unknown): TraceabilityContractDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const id = val<string>(o, 'id', 'id');
  const contractType = val<'farmer_trader' | 'trader_buyer'>(o, 'contractType', 'contract_type');
  const status = val<string>(o, 'status', 'status');
  const unit = val<string>(o, 'unit', 'unit');
  const startDate = val<string>(o, 'startDate', 'start_date');
  const endDate = val<string>(o, 'endDate', 'end_date');
  const quantityRaw = val<number | string>(o, 'quantity', 'quantity');
  if (!id || !contractType || !status || !unit || !startDate || !endDate) return undefined;
  const quantity = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw ?? 0);
  return {
    id,
    contractType,
    status,
    unit,
    startDate,
    endDate,
    quantity,
    productName: val<string | null>(o, 'productName', 'product_name') ?? null,
    plantingDate: val<string | null>(o, 'plantingDate', 'planting_date') ?? null,
    signedAt: val<string | null>(o, 'signedAt', 'signed_at') ?? null,
    sourceContractId: val<string | null>(o, 'sourceContractId', 'source_contract_id') ?? null,
  };
}

function mapParty(raw: unknown): TraceabilityPartyDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const name = val<string | null>(o, 'name', 'name') ?? null;
  const phone = val<string | null>(o, 'phone', 'phone') ?? null;
  if (!name && !phone) return undefined;
  return { name, phone };
}

export function mapTraceabilityDto(raw: unknown): TraceabilityDto {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('INVALID_INPUT', 'Phản hồi truy xuất không hợp lệ.', 500);
  }
  const o = raw as Record<string, unknown>;
  const productCode = val<string>(o, 'productCode', 'product_code');
  if (!productCode) {
    throw new ApiError('INVALID_INPUT', 'Thiếu mã sản phẩm trong phản hồi truy xuất.', 500);
  }
  const farm = mapFarm(o.farm ?? o['farm']);
  const standard = mapStandard(o.standard ?? o['standard']);
  const contract = mapContract(o.contract);
  const farmer = mapParty(o.farmer);
  const trader = mapParty(o.trader);
  const buyer = mapParty(o.buyer);
  const careRaw = val<unknown[]>(o, 'careLogTimeline', 'care_log_timeline') ?? [];
  const careLogTimeline = Array.isArray(careRaw)
    ? (careRaw.map(mapCareItem).filter(Boolean) as TraceabilityCareLogTimelineItemDto[])
    : [];
  const chartRaw = val<unknown[]>(o, 'sensorChart', 'sensor_chart') ?? [];
  const sensorChart = Array.isArray(chartRaw)
    ? (chartRaw.map(mapSensorSeries).filter(Boolean) as TraceabilitySensorChartSeriesDto[])
    : [];
  return {
    productCode,
    contract,
    farmer,
    trader,
    buyer,
    farm,
    standard,
    careLogTimeline,
    sensorChart,
  };
}

/** Thông báo lỗi tiếng Việt (ErrorResponse / ApiError) cho màn truy xuất. */
export function toTraceabilityViMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'NOT_FOUND':
        return 'Không tìm thấy thông tin truy xuất cho mã này.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều lượt tra cứu. Vui lòng thử lại sau ít phút.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'INVALID_INPUT':
        return err.message || 'Dữ liệu truy xuất không hợp lệ.';
      default:
        return err.message || 'Không thể tải thông tin truy xuất. Vui lòng thử lại.';
    }
  }
  return 'Không thể tải thông tin truy xuất. Vui lòng thử lại.';
}

/**
 * GET /api/v1/traceability/qr/:code — không gửi Authorization (skipAuth).
 * Luồng Zalo Mini App: khách không cần token; khi đã đăng nhập token vẫn không được gửi lên endpoint này.
 */
export async function getTraceabilityByQrCode(code: string): Promise<TraceabilityDto> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new ApiError('NOT_FOUND', 'Mã truy xuất không được để trống.', 404);
  }
  const { data } = await apiClient.get<unknown>(
    `/traceability/qr/${encodeURIComponent(trimmed)}`,
    { skipAuth: true },
  );
  return mapTraceabilityDto(data);
}
