import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Hợp đồng lỗi chuẩn — áp dụng cho mọi endpoint (design.md §1.2)
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Tổng hợp lịch sử giao dịch người mua (FR-U06, `includeSummary=true`)
 */
export interface BuyerTransactionSummaryDto {
  /** Decimal string to avoid precision loss for large VND values */
  totalSpent: string;
  completedCount: number;
}

/**
 * Phản hồi danh sách chuẩn (design.md §1.3)
 */
export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  /** Có khi `includeSummary=true` trên GET /orders hoặc GET /contracts */
  summary?: BuyerTransactionSummaryDto;
}

/**
 * Query params chung cho phân trang
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
