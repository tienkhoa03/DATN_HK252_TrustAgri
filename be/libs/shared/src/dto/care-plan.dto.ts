/**
 * Nhiệm vụ trong ngày của kế hoạch chăm sóc (B2 — Daily Care Plan)
 */
export interface DailyTaskDto {
  /** Composite key: `${farmId}:${standardStepId}` */
  id: string;
  farmId: string;
  standardStepId: string;
  title: string;
  description: string;
  /** Ngày thứ mấy trong chu kỳ (1-based) mà bước này bắt đầu */
  expectedDay?: number;
  /** Ngày dự kiến thực hiện (ISO date YYYY-MM-DD) */
  dueDate?: string;
  /** true nếu đã có ít nhất một care_log cho bước này */
  completed: boolean;
  /** ISO timestamp khi log đầu tiên được ghi */
  completedAt?: string;
  acceptanceCriteria?: string;
}

/**
 * Phản hồi kế hoạch chăm sóc theo ngày (B2)
 */
export interface CarePlanResponseDto {
  farmId: string;
  plantingDate?: string;
  /** Ngày hiện tại trong chu kỳ canh tác (1-based) */
  cycleDay?: number;
  tasks: DailyTaskDto[];
}

/**
 * Phản hồi khi đánh dấu hoàn thành một bước
 */
export interface CompleteTaskResponseDto {
  success: boolean;
  careLogId: string;
}
