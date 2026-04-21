import { IsOptional, IsIn, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '@trustagri/shared';

export class OrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed'])
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'contracted' | 'completed';

  /** buyer | trader — lọc theo role của người gọi */
  @IsOptional()
  @IsIn(['buyer', 'trader'])
  role?: 'buyer' | 'trader';

  /**
   * `me` = người mua hiện tại (chỉ role buyer).
   * UUID = lọc đơn theo buyer (thương lái xem đơn của một người mua).
   */
  @IsOptional()
  @IsString()
  buyerId?: string;

  /** ISO date string — lọc từ ngày */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date string — lọc đến ngày */
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
