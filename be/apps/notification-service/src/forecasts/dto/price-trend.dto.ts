import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// FR-G02: query cho biểu đồ giá công khai (Guest).
export class PriceTrendQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo loại nông sản', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Số điểm dữ liệu gần nhất (1-30)', example: 7, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number;
}

// Phản hồi aggregate giá theo cropType — KHÔNG chứa PII thương lái (NFR-S).
export interface PriceTrendPoint {
  day: string;
  price: number;
}

export interface PriceTrendDto {
  cropType: string;
  productLabel: string | null;
  trend: 'up' | 'down' | 'stable' | null;
  changePercent: number | null;
  series: PriceTrendPoint[];
  updatedAt: string;
}
