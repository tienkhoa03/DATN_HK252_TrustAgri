import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchFarmerQueryDto {
  /** Lọc theo vùng địa lý (farmerProfile.region) */
  @ApiPropertyOptional({ description: 'Filter by region', example: 'An Giang' })
  @IsOptional()
  @IsString()
  region?: string;

  /** Lọc theo loại cây trồng (join với bảng farms) */
  @ApiPropertyOptional({ description: 'Filter by crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

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
