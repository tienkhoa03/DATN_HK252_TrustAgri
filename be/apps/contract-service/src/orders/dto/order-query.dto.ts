import { IsOptional, IsIn, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class OrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed'])
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'contracted' | 'completed';

  /** buyer | trader — lọc theo role của người gọi */
  @IsOptional()
  @IsIn(['buyer', 'trader'])
  role?: 'buyer' | 'trader';

  /** ISO date string — lọc từ ngày */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date string — lọc đến ngày */
  @IsOptional()
  @IsString()
  to?: string;
}
