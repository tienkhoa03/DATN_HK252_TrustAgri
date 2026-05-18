/**
 * proposalService — gọi thực tế tới Contract Service (module proposals) qua API Gateway.
 *
 * Endpoints (design.md §4.4.4):
 *   GET    /api/v1/proposals
 *   POST   /api/v1/proposals              (trader)
 *   POST   /api/v1/proposals/:id/accept   (buyer)
 *   POST   /api/v1/proposals/:id/reject   (buyer)
 *
 * Server lọc theo JWT: trader thấy đề xuất của mình; buyer thấy đề xuất trên nhu cầu của mình.
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';
import { userDisplayLabel } from '@/utils/displayLabels';

export interface ProposalDto {
  id: string;
  buyingRequestId: string;
  traderId: string;
  farmId?: string;
  sourceContractId?: string;
  traderDisplayName?: string | null;
  traderPhone?: string | null;
  farmName?: string | null;
  price: number;
  quantity: number;
  standardCode?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListProposalsParams {
  buyingRequestId?: string;
  status?: ProposalDto['status'] | 'all';
  page?: number;
  limit?: number;
}

export interface CreateProposalDto {
  buyingRequestId: string;
  sourceContractId: string;
  price: number;
  quantity: number;
  standardCode?: string;
  note?: string;
}

export const STANDARD_LABELS_PROP: Record<string, string> = {
  VIETGAP_2024: 'VietGAP',
  GLOBALGAP_2024: 'GlobalGAP',
  ORGANIC_2024: 'Hữu cơ',
  OCOP_2024: 'OCOP',
};

export function standardLabelProp(code?: string): string | undefined {
  if (!code) return undefined;
  return STANDARD_LABELS_PROP[code] ?? code;
}

export function traderDisplayName(
  traderId: string,
  name?: string | null,
  phone?: string | null,
): string {
  return userDisplayLabel(name, traderId, 'Thương lái', phone);
}

export function proposalStatusLabel(status: ProposalDto['status']): string {
  switch (status) {
    case 'pending':  return 'Đang chờ';
    case 'accepted': return 'Đã chấp nhận';
    case 'rejected': return 'Đã từ chối';
    default:         return status;
  }
}

type PropCtx = 'list' | 'create' | 'accept' | 'reject';

export function toProposalViMessage(err: unknown, context: PropCtx = 'list'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này với đề xuất.';
      case 'NOT_FOUND':
        return 'Không tìm thấy đề xuất hoặc nhu cầu mua.';
      case 'CONFLICT':
        return 'Đề xuất đã được xử lý. Vui lòng tải lại.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
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
  const fallback: Record<PropCtx, string> = {
    list:   'Không thể tải danh sách đề xuất.',
    create: 'Không thể gửi đề xuất.',
    accept: 'Không thể chấp nhận đề xuất.',
    reject: 'Không thể từ chối đề xuất.',
  };
  return fallback[context];
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function listProposals(params?: ListProposalsParams): Promise<ListResponse<ProposalDto>> {
  const q: Record<string, unknown> = {};
  if (params?.buyingRequestId) q.buyingRequestId = params.buyingRequestId;
  if (params?.status && params.status !== 'all') q.status = params.status;
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;

  const { data } = await apiClient.get<ListResponse<ProposalDto>>('/proposals', { params: q });
  return data;
}

export async function createProposal(body: CreateProposalDto): Promise<ProposalDto> {
  const { data } = await apiClient.post<ProposalDto>('/proposals', body);
  return data;
}

export async function acceptProposal(id: string): Promise<ProposalDto> {
  const { data } = await apiClient.post<ProposalDto>(`/proposals/${id}/accept`);
  return data;
}

export async function rejectProposal(id: string): Promise<ProposalDto> {
  const { data } = await apiClient.post<ProposalDto>(`/proposals/${id}/reject`);
  return data;
}
