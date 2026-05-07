/**
 * carePlanService — Daily care plan / today tasks (Phase B2).
 *
 * Endpoints (farm-service):
 *   GET  /api/v1/farms/:farmId/care-plan/today                          → CarePlanResponseDto
 *   POST /api/v1/farms/:farmId/care-plan/tasks/:standardStepId/complete → { success, careLogId }
 *
 * Tasks được sinh từ farm.standardId + farm.plantingDate + standard.steps[].
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

export interface DailyTaskDto {
  id: string;
  farmId: string;
  standardStepId: string;
  title: string;
  description: string;
  expectedDay?: number;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  acceptanceCriteria?: string;
}

export interface CarePlanResponseDto {
  farmId: string;
  plantingDate?: string;
  cycleDay?: number;
  tasks: DailyTaskDto[];
}

export async function getTodayPlan(farmId: string): Promise<CarePlanResponseDto> {
  const { data } = await apiClient.get<CarePlanResponseDto>(
    `/farms/${encodeURIComponent(farmId)}/care-plan/today`,
  );
  return data;
}

export async function completeCareTask(
  farmId: string,
  standardStepId: string,
): Promise<{ success: true; careLogId: string }> {
  const { data } = await apiClient.post<{ success: true; careLogId: string }>(
    `/farms/${encodeURIComponent(farmId)}/care-plan/tasks/${encodeURIComponent(standardStepId)}/complete`,
  );
  return data;
}

// ── Vietnamese error mapping ─────────────────────────────────────────────────

type CarePlanCtx = 'today' | 'complete';

export function toCarePlanViMessage(err: unknown, context: CarePlanCtx = 'today'): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền xem lịch chăm sóc của vườn này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy vườn hoặc bước quy trình.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Thử lại sau.';
      default:
        if (err.message) return err.message;
    }
  }
  const fallback: Record<CarePlanCtx, string> = {
    today: 'Không thể tải lịch công việc hôm nay.',
    complete: 'Không thể đánh dấu công việc hoàn thành.',
  };
  return fallback[context];
}
