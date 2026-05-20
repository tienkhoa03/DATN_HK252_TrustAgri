import { IsOptional, IsIn, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ContractQueryDto extends PaginationQueryDto {
  /**
   * Lọc hợp đồng theo vai trò bên tham gia (phải khớp JWT, trừ admin xem toàn bộ).
   */
  @ApiPropertyOptional({ description: 'Filter by participant role', enum: ['farmer', 'trader', 'buyer'], example: 'farmer' })
  @IsOptional()
  @IsIn(['farmer', 'trader', 'buyer'])
  role?: 'farmer' | 'trader' | 'buyer';

  /**
   * `me` = partyBuyerId = user hiện tại (chỉ role buyer).
   * UUID = lọc hợp đồng theo người mua (admin hoặc thương lái).
   */
  @ApiPropertyOptional({ description: 'Filter by buyer ID ("me" for current user)', example: 'me' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract status',
    enum: ['pending_signature', 'active', 'pending_change', 'in_settlement', 'completed', 'cancelled'],
    example: 'active',
  })
  @IsOptional()
  @IsIn(['pending_signature', 'active', 'pending_change', 'in_settlement', 'completed', 'cancelled'])
  status?: 'pending_signature' | 'active' | 'pending_change' | 'in_settlement' | 'completed' | 'cancelled';

  /** Lọc hợp đồng theo farmId — dùng bởi monitoring-service khi kiểm tra quyền WS. */
  @ApiPropertyOptional({ description: 'Filter by farm ID (UUID)', example: 'f0e1a2b3-c4d5-6789-abcd-ef0123456789' })
  @IsOptional()
  @IsString()
  farmId?: string;

  /** ISO datetime — lọc theo createdAt từ */
  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO datetime — lọc theo createdAt đến */
  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Include buyer transaction summary in response', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  includeSummary?: boolean;
}
