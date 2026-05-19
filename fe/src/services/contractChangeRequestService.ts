/**
 * contractChangeRequestService — Yêu cầu chỉnh sửa hợp đồng qua API Gateway
 * (specs/backend-api-specification/design.md §4.4.5)
 *
 *   GET    /api/v1/contracts/:id/change-requests
 *   POST   /api/v1/contracts/:id/change-requests
 *   POST   /api/v1/contracts/:id/change-requests/:changeId/accept
 *   POST   /api/v1/contracts/:id/change-requests/:changeId/reject
 *
 * JWT: Authorization Bearer từ interceptor.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export type ContractChangeAction = 'modify' | 'cancel' | 'complete';

export interface ContractChangeRequestDto {
  id: string;
  contractId: string;
  action: ContractChangeAction;
  requestedBy: string;
  requestedByName?: string | null;
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedBy?: string;
  respondedByName?: string | null;
  createdAt: string;
  respondedAt?: string;
}

export interface CreateContractChangeRequestDto {
  action?: ContractChangeAction;
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>;
  reason?: string;
}

/** Chuẩn hóa payload từ API (camelCase chuẩn; phòng snake_case nếu cấu hình khác). */
function normalizeDiff(v: unknown): { oldValue: unknown; newValue: unknown } {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const oldValue = o.oldValue ?? o.old_value;
    const newValue = o.newValue ?? o.new_value;
    return { oldValue, newValue };
  }
  return { oldValue: undefined, newValue: undefined };
}

function normalizeChanges(
  raw: unknown,
): Record<string, { oldValue: unknown; newValue: unknown }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, { oldValue: unknown; newValue: unknown }> = {};
  for (const [key, val] of Object.entries(raw)) {
    out[key] = normalizeDiff(val);
  }
  return out;
}

export function normalizeContractChangeRequestDto(raw: unknown): ContractChangeRequestDto {
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '');
  const contractId = String(r.contractId ?? r.contract_id ?? '');
  const requestedBy = String(r.requestedBy ?? r.requested_by ?? '');
  const status = (r.status ?? 'pending') as ContractChangeRequestDto['status'];
  const actionRaw = r.action;
  const action: ContractChangeAction =
    actionRaw === 'cancel' || actionRaw === 'complete' ? actionRaw : 'modify';
  const createdAt =
    typeof r.createdAt === 'string'
      ? r.createdAt
      : typeof r.created_at === 'string'
        ? r.created_at
        : '';
  const respondedAt =
    typeof r.respondedAt === 'string'
      ? r.respondedAt
      : typeof r.responded_at === 'string'
        ? r.responded_at
        : undefined;
  const respondedBy =
    typeof r.respondedBy === 'string'
      ? r.respondedBy
      : typeof r.responded_by === 'string'
        ? r.responded_by
        : undefined;
  const requestedByName =
    typeof r.requestedByName === 'string'
      ? r.requestedByName
      : typeof r.requested_by_name === 'string'
        ? r.requested_by_name
        : null;
  const respondedByName =
    typeof r.respondedByName === 'string'
      ? r.respondedByName
      : typeof r.responded_by_name === 'string'
        ? r.responded_by_name
        : null;
  const reason =
    r.reason === undefined || r.reason === null ? undefined : String(r.reason);

  return {
    id,
    contractId,
    action,
    requestedBy,
    requestedByName,
    changes: normalizeChanges(r.changes),
    reason,
    status,
    respondedBy,
    respondedByName,
    createdAt,
    respondedAt,
  };
}

type Ctx = 'list' | 'create' | 'accept' | 'reject';

export function toContractChangeRequestViMessage(err: unknown, context: Ctx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return err.message || 'Bạn không có quyền thao tác với yêu cầu thay đổi này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy hợp đồng hoặc yêu cầu thay đổi.';
      case 'CONFLICT':
        return 'Trạng thái đã thay đổi. Vui lòng tải lại.';
      case 'INVALID_INPUT':
        if (err.message) return err.message;
        return 'Dữ liệu không hợp lệ (kiểm tra oldValue khớp hợp đồng hiện tại).';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<Ctx, string> = {
    list: 'Không thể tải danh sách yêu cầu thay đổi.',
    create: 'Không thể gửi yêu cầu thay đổi.',
    accept: 'Không thể chấp nhận yêu cầu.',
    reject: 'Không thể từ chối yêu cầu.',
  };
  return fallback[context];
}

/**
 * GET /api/v1/contracts/:contractId/change-requests — BE trả mảng (không bọc ListResponse).
 */
export async function listContractChangeRequests(contractId: string): Promise<ContractChangeRequestDto[]> {
  const { data } = await apiClient.get<unknown[]>(`/contracts/${contractId}/change-requests`);
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeContractChangeRequestDto(row));
}

export async function createContractChangeRequest(
  contractId: string,
  body: CreateContractChangeRequestDto,
): Promise<ContractChangeRequestDto> {
  const { data } = await apiClient.post<unknown>(`/contracts/${contractId}/change-requests`, body);
  return normalizeContractChangeRequestDto(data);
}

export async function acceptContractChangeRequest(
  contractId: string,
  changeId: string,
): Promise<ContractChangeRequestDto> {
  const { data } = await apiClient.post<unknown>(
    `/contracts/${contractId}/change-requests/${changeId}/accept`,
  );
  return normalizeContractChangeRequestDto(data);
}

export async function rejectContractChangeRequest(
  contractId: string,
  changeId: string,
): Promise<ContractChangeRequestDto> {
  const { data } = await apiClient.post<unknown>(
    `/contracts/${contractId}/change-requests/${changeId}/reject`,
  );
  return normalizeContractChangeRequestDto(data);
}

/**
 * Yêu cầu hủy hợp đồng (cần đối tác chấp nhận).
 * Sau khi tạo, hợp đồng chuyển sang `pending_change` cho đến khi đối tác accept → cancelled, hoặc reject → active.
 */
export async function requestCancelContract(
  contractId: string,
  reason?: string,
): Promise<ContractChangeRequestDto> {
  return createContractChangeRequest(contractId, { action: 'cancel', reason });
}

/**
 * Yêu cầu hoàn thành hợp đồng (cần đối tác chấp nhận).
 * Sau khi tạo, hợp đồng chuyển sang `pending_change` → accept → completed.
 */
export async function requestCompleteContract(
  contractId: string,
  reason?: string,
): Promise<ContractChangeRequestDto> {
  return createContractChangeRequest(contractId, { action: 'complete', reason });
}

/**
 * Yêu cầu điều chỉnh hợp đồng (cần đối tác chấp nhận).
 * changes: map field → { oldValue, newValue } khớp giá trị hiện tại.
 */
export async function requestModifyContract(
  contractId: string,
  changes: Record<string, { oldValue: unknown; newValue: unknown }>,
  reason?: string,
): Promise<ContractChangeRequestDto> {
  return createContractChangeRequest(contractId, { action: 'modify', changes, reason });
}
