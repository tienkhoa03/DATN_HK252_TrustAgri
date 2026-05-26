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
  area?: number;
  plantingDate?: string;
  ownerDisplayName?: string;
}

export interface TraceabilityStandardDto {
  code: string;
  name: string;
}

export interface TraceabilityEvidenceDto {
  fileUrl: string;
  mimeType: string;
  capturedAt: string;
}

export interface TraceabilityCareLogTimelineItemDto {
  id: string;
  action: string;
  standardStepTitle?: string;
  standardStepOrder?: number;
  performedAt: string;
  notes?: string;
  deviation: boolean;
  isLate: boolean;
  isEdited: boolean;
  evidences: TraceabilityEvidenceDto[];
}

export interface TraceabilityProcessStepDto {
  order: number;
  title: string;
  expectedDurationDays: number | null;
  completed: boolean;
}

export interface TraceabilityProcessComplianceSummaryDto {
  totalSteps: number;
  completedSteps: number;
  deviationCount: number;
  lateCount: number;
  coverageRatio: number;
  steps: TraceabilityProcessStepDto[];
}

export interface TraceabilityEnvironmentReadingDto {
  sensorType: string;
  value: number;
  recordedAt: string;
  isImputed?: boolean;
}

export interface TraceabilityComplianceCertificateDto {
  contractId: string;
  standardCode?: string;
  totalSteps?: number;
  completedSteps?: number;
  deviationCount?: number;
  complianceScore?: number;
  lastComputedAt?: string;
  status: 'verified' | 'pending' | 'none';
}

export interface TraceabilitySensorChartPointDto {
  t: string;
  value: number;
}

export interface TraceabilitySensorChartSeriesDto {
  sensorType: string;
  series: TraceabilitySensorChartPointDto[];
}

export interface TraceabilityContractContextDto {
  id: string;
  traceabilityCode: string;
  status: 'pending_signature' | 'active' | 'pending_change' | 'in_settlement' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  plantingDate?: string | null;
  standardName?: string | null;
  productName?: string | null;
  quantity?: number;
  unit?: string;
}

export interface TraceabilityDto {
  productCode: string;
  scope: 'contract' | 'farm-overview';
  contract?: TraceabilityContractContextDto;
  farm: TraceabilityFarmDto;
  standard?: TraceabilityStandardDto;
  careLogTimeline: TraceabilityCareLogTimelineItemDto[];
  process?: TraceabilityProcessComplianceSummaryDto;
  sensorChart: TraceabilitySensorChartSeriesDto[];
  currentEnvironment: TraceabilityEnvironmentReadingDto[];
  complianceCertificate?: TraceabilityComplianceCertificateDto;
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
    area: val<number>(o, 'area', 'area'),
    plantingDate: val<string>(o, 'plantingDate', 'planting_date'),
    ownerDisplayName: val<string>(o, 'ownerDisplayName', 'owner_display_name'),
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

function mapEvidence(raw: unknown): TraceabilityEvidenceDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const fileUrl = val<string>(o, 'fileUrl', 'file_url');
  const mimeType = val<string>(o, 'mimeType', 'mime_type');
  const capturedAt = val<string>(o, 'capturedAt', 'captured_at');
  if (!fileUrl || !mimeType || !capturedAt) return null;
  return { fileUrl, mimeType, capturedAt };
}

function mapCareItem(raw: unknown): TraceabilityCareLogTimelineItemDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = val<string>(o, 'id', 'id');
  const action = val<string>(o, 'action', 'action');
  const performedAt = val<string>(o, 'performedAt', 'performed_at');
  if (!id || !action || !performedAt) return null;
  const notes = val<string | undefined>(o, 'notes', 'notes');
  const standardStepTitle = val<string | undefined>(o, 'standardStepTitle', 'standard_step_title');
  const standardStepOrder = val<number | undefined>(o, 'standardStepOrder', 'standard_step_order');
  const deviation = (val<boolean>(o, 'deviation', 'deviation')) ?? false;
  const isLate = (val<boolean>(o, 'isLate', 'is_late')) ?? false;
  const isEdited = (val<boolean>(o, 'isEdited', 'is_edited')) ?? false;
  const evidencesRaw = val<unknown[]>(o, 'evidences', 'evidences') ?? [];
  const evidences = Array.isArray(evidencesRaw)
    ? (evidencesRaw.map(mapEvidence).filter(Boolean) as TraceabilityEvidenceDto[])
    : [];
  return { id, action, standardStepTitle, standardStepOrder, performedAt, notes, deviation, isLate, isEdited, evidences };
}

function mapProcessCompliance(raw: unknown): TraceabilityProcessComplianceSummaryDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const totalSteps = val<number>(o, 'totalSteps', 'total_steps') ?? 0;
  const completedSteps = val<number>(o, 'completedSteps', 'completed_steps') ?? 0;
  const deviationCount = val<number>(o, 'deviationCount', 'deviation_count') ?? 0;
  const lateCount = val<number>(o, 'lateCount', 'late_count') ?? 0;
  const coverageRatio = val<number>(o, 'coverageRatio', 'coverage_ratio') ?? 0;
  const stepsRaw = val<unknown[]>(o, 'steps', 'steps') ?? [];
  const steps: TraceabilityProcessStepDto[] = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((s) => {
          if (!s || typeof s !== 'object') return null;
          const so = s as Record<string, unknown>;
          return {
            order: val<number>(so, 'order', 'order') ?? 0,
            title: val<string>(so, 'title', 'title') ?? '',
            expectedDurationDays: val<number | null>(so, 'expectedDurationDays', 'expected_duration_days') ?? null,
            completed: (val<boolean>(so, 'completed', 'completed')) ?? false,
          };
        })
        .filter(Boolean) as TraceabilityProcessStepDto[]
    : [];
  return { totalSteps, completedSteps, deviationCount, lateCount, coverageRatio, steps };
}

function mapEnvironment(raw: unknown): TraceabilityEnvironmentReadingDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const sensorType = val<string>(o, 'sensorType', 'sensor_type');
  const valueRaw = val<number | string>(o, 'value', 'value');
  const recordedAt = val<string>(o, 'recordedAt', 'recorded_at');
  if (!sensorType || valueRaw === undefined || !recordedAt) return null;
  const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
  return { sensorType, value, recordedAt, isImputed: val<boolean>(o, 'isImputed', 'is_imputed') };
}

function mapComplianceCertificate(raw: unknown): TraceabilityComplianceCertificateDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const contractId = val<string>(o, 'contractId', 'contract_id');
  const status = val<string>(o, 'status', 'status') as 'verified' | 'pending' | 'none' | undefined;
  if (!contractId || !status) return undefined;
  return {
    contractId,
    status,
    standardCode: val<string>(o, 'standardCode', 'standard_code'),
    totalSteps: val<number>(o, 'totalSteps', 'total_steps'),
    completedSteps: val<number>(o, 'completedSteps', 'completed_steps'),
    deviationCount: val<number>(o, 'deviationCount', 'deviation_count'),
    complianceScore: val<number>(o, 'complianceScore', 'compliance_score'),
    lastComputedAt: val<string>(o, 'lastComputedAt', 'last_computed_at'),
  };
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

function mapContractContext(raw: unknown): TraceabilityContractContextDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const id = val<string>(o, 'id', 'id');
  const traceabilityCode = val<string>(o, 'traceabilityCode', 'traceability_code');
  const status = val<string>(o, 'status', 'status') as TraceabilityContractContextDto['status'] | undefined;
  const startDate = val<string>(o, 'startDate', 'start_date');
  const endDate = val<string>(o, 'endDate', 'end_date');
  if (!id || !traceabilityCode || !status || !startDate || !endDate) return undefined;
  return {
    id,
    traceabilityCode,
    status,
    startDate,
    endDate,
    plantingDate: val<string | null>(o, 'plantingDate', 'planting_date'),
    standardName: val<string | null>(o, 'standardName', 'standard_name'),
    productName: val<string | null>(o, 'productName', 'product_name'),
    quantity: val<number>(o, 'quantity', 'quantity'),
    unit: val<string>(o, 'unit', 'unit'),
  };
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
  const careRaw = val<unknown[]>(o, 'careLogTimeline', 'care_log_timeline') ?? [];
  const careLogTimeline = Array.isArray(careRaw)
    ? (careRaw.map(mapCareItem).filter(Boolean) as TraceabilityCareLogTimelineItemDto[])
    : [];
  const process = mapProcessCompliance(o.process);
  const chartRaw = val<unknown[]>(o, 'sensorChart', 'sensor_chart') ?? [];
  const sensorChart = Array.isArray(chartRaw)
    ? (chartRaw.map(mapSensorSeries).filter(Boolean) as TraceabilitySensorChartSeriesDto[])
    : [];
  const envRaw = val<unknown[]>(o, 'currentEnvironment', 'current_environment') ?? [];
  const currentEnvironment = Array.isArray(envRaw)
    ? (envRaw.map(mapEnvironment).filter(Boolean) as TraceabilityEnvironmentReadingDto[])
    : [];
  const complianceCertificate = mapComplianceCertificate(o.complianceCertificate ?? o['compliance_certificate']);
  const scope = (val<string>(o, 'scope', 'scope') ?? 'farm-overview') as 'contract' | 'farm-overview';
  const contract = mapContractContext(o.contract ?? o['contract']);
  return {
    productCode,
    scope,
    contract,
    farm,
    standard,
    careLogTimeline,
    process,
    sensorChart,
    currentEnvironment,
    complianceCertificate,
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
