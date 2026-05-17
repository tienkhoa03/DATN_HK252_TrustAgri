/**
 * careLogService — gọi thực tế tới Farm Service (module care-logs) qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.3):
 *   GET  /api/v1/farms/:farmId/care-logs          → ListResponse<CareLogDto>
 *   POST /api/v1/farms/:farmId/care-logs          → CareLogDto
 *   POST /api/v1/farms/:farmId/care-logs/sync     → CareLogSyncResponse
 *   POST /api/v1/farms/:farmId/evidence           → EvidenceDto
 *
 * Tất cả trường JSON đều camelCase theo quy ước backend (design.md §1.1).
 * Bearer token được gắn tự động bởi request interceptor trong interceptors.ts.
 *
 * FR: FR-F09 (nhật ký chăm sóc + minh chứng + đồng bộ offline)
 */

import apiClient from '@/api/client';

// ── DTO types (camelCase — khớp backend design.md §4.3) ───────────────────────

export interface EvidenceDto {
  id: string;
  careLogId: string;
  fileUrl: string;
  mimeType: string;
  capturedAt: string;
}

export interface CareLogDto {
  id: string;
  farmId: string;
  standardStepId?: string;
  action: string;          // "watering" | "fertilizing" | "pest_control" | ...
  notes?: string;
  performedAt: string;     // ISO-8601
  performedBy?: string;
  performedByName?: string | null;
  evidences: EvidenceDto[];
  deviation?: boolean;     // lệch quy trình (FR-T11)
  syncStatus: 'synced' | 'pending' | 'conflict';
  clientRecordId?: string; // idempotency cho đồng bộ offline
}

export interface CareLogSyncResponse {
  results: Array<{
    clientRecordId: string;
    status: 'accepted' | 'conflicted' | 'rejected';
    serverId?: string;
    reason?: string;
  }>;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListCareLogsParams {
  page?: number;
  limit?: number;
  standardStepId?: string;
}

export type CreateCareLogDto = {
  action: string;
  notes?: string;
  performedAt: string;
  standardStepId?: string;
  clientRecordId?: string;
};

export type UploadEvidenceBody = {
  careLogId: string;
  fileUrl: string;
  mimeType: string;
  capturedAt: string;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/farms/:farmId/care-logs
 * Danh sách nhật ký chăm sóc của một vườn, có phân trang.
 */
export async function listCareLogs(
  farmId: string,
  params: ListCareLogsParams = {},
): Promise<ListResponse<CareLogDto>> {
  const { data } = await apiClient.get<ListResponse<CareLogDto>>(
    `/farms/${farmId}/care-logs`,
    { params },
  );
  return data;
}

/**
 * POST /api/v1/farms/:farmId/care-logs
 * Tạo một nhật ký chăm sóc mới — chỉ chủ vườn (guard server-side).
 */
export async function createCareLog(
  farmId: string,
  body: CreateCareLogDto,
): Promise<CareLogDto> {
  const { data } = await apiClient.post<CareLogDto>(
    `/farms/${farmId}/care-logs`,
    body,
  );
  return data;
}

/**
 * POST /api/v1/farms/:farmId/care-logs/sync
 * Đồng bộ batch hàng đợi offline — idempotent qua clientRecordId.
 */
export async function syncCareLogs(
  farmId: string,
  logs: CreateCareLogDto[],
): Promise<CareLogSyncResponse> {
  const { data } = await apiClient.post<CareLogSyncResponse>(
    `/farms/${farmId}/care-logs/sync`,
    { logs },
  );
  return data;
}

/**
 * POST /api/v1/farms/:farmId/evidence
 * Lưu metadata minh chứng (URL file đã upload, BE lưu metadata).
 */
export async function uploadEvidence(
  farmId: string,
  body: UploadEvidenceBody,
): Promise<EvidenceDto> {
  const { data } = await apiClient.post<EvidenceDto>(
    `/farms/${farmId}/evidence`,
    body,
  );
  return data;
}
