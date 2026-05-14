import { IsOptional, IsIn, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed'],
    example: 'pending',
  })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed'])
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'contracted' | 'completed';

  /** buyer | trader — lọc theo role của người gọi */
  @ApiPropertyOptional({ description: 'Filter by caller role', enum: ['buyer', 'trader'], example: 'buyer' })
  @IsOptional()
  @IsIn(['buyer', 'trader'])
  role?: 'buyer' | 'trader';

  /**
   * `me` = người mua hiện tại (chỉ role buyer).
   * UUID = lọc đơn theo buyer (thương lái xem đơn của một người mua).
   */
  @ApiPropertyOptional({ description: 'Filter by buyer ID ("me" for current user)', example: 'me' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  /** ISO date string — lọc từ ngày */
  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date string — lọc đến ngày */
  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Include buyer transaction summary in response', example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  includeSummary?: boolean;
}
