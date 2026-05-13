import { IsOptional, IsIn, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '@trustagri/shared';

export class ContractQueryDto extends PaginationQueryDto {
  /**
   * Lọc hợp đồng theo vai trò bên tham gia (phải khớp JWT, trừ admin xem toàn bộ).
   */
  @IsOptional()
  @IsIn(['farmer', 'trader', 'buyer'])
  role?: 'farmer' | 'trader' | 'buyer';

  /**
   * `me` = partyBuyerId = user hiện tại (chỉ role buyer).
   * UUID = lọc hợp đồng theo người mua (admin hoặc thương lái).
   */
  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsIn(['pending_signature', 'active', 'pending_change', 'completed', 'cancelled'])
  status?: 'pending_signature' | 'active' | 'pending_change' | 'completed' | 'cancelled';

  /** ISO datetime — lọc theo createdAt từ */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO datetime — lọc theo createdAt đến */
  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  includeSummary?: boolean;
}
