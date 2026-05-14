import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchTraderQueryDto {
  /** Lọc theo vùng địa lý (traderProfile.region) */
  @ApiPropertyOptional({ description: 'Filter by region', example: 'Mekong Delta' })
  @IsOptional()
  @IsString()
  region?: string;

  /** Lọc theo loại cây trồng trader phụ trách (best-effort, so khớp với products) */
  @ApiPropertyOptional({ description: 'Filter by crop type trader deals in', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  /** Điểm tin cậy tối thiểu (traderProfile.trustScore) */
  @ApiPropertyOptional({ description: 'Minimum trust score filter', example: 70, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  trustScore?: number;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
