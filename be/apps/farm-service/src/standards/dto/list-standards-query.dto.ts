import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ListStandardsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by trader owner ID', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  ownerTraderId?: string;

  // Trả về tiêu chuẩn hệ thống (owner_trader_id IS NULL) + tiêu chuẩn của trader này
  @ApiPropertyOptional({ description: 'Return system standards plus standards owned by this trader', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  includedTraderId?: string;
}
