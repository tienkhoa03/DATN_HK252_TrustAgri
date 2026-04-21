import { IsOptional, IsIn, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class ContractQueryDto extends PaginationQueryDto {
  /**
   * Lọc hợp đồng theo vai trò bên tham gia (phải khớp JWT, trừ admin xem toàn bộ).
   */
  @IsOptional()
  @IsIn(['farmer', 'trader', 'buyer'])
  role?: 'farmer' | 'trader' | 'buyer';

  @IsOptional()
  @IsIn(['active', 'pending_change', 'completed', 'cancelled'])
  status?: 'active' | 'pending_change' | 'completed' | 'cancelled';

  /** ISO datetime — lọc theo createdAt từ */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO datetime — lọc theo createdAt đến */
  @IsOptional()
  @IsString()
  to?: string;
}
