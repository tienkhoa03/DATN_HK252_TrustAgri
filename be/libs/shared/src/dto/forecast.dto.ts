import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// FR-T12: chuẩn hóa schema forecastData (price/demand/weather).
export type ForecastTrend = 'up' | 'down' | 'stable';
export type ForecastRiskLevel = 'low' | 'medium' | 'high';

/**
 * Một điểm trên chuỗi thời gian của forecastData (price & demand dùng chung key `series`).
 * `price` cho forecast loại price, `demand` cho loại demand.
 */
export class ForecastSeriesItemDto {
  @ApiProperty({ description: 'Nhãn mốc thời gian', example: 'T2' })
  @IsString()
  day: string;

  @ApiPropertyOptional({ description: 'Giá (forecast loại price)', example: 31 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Chỉ số nhu cầu (forecast loại demand)', example: 110 })
  @IsOptional()
  @IsNumber()
  demand?: number;
}

/**
 * Payload chuẩn cho cột `forecastData` (JSONB). Mọi field optional để không loại bỏ
 * dữ liệu hợp lệ của 3 loại forecast; validate kiểu để chặn schema sai (FR-T12).
 */
export class ForecastPayloadDto {
  @ApiPropertyOptional({ description: 'Nhãn sản phẩm', example: 'Sầu riêng Monthong' })
  @IsOptional()
  @IsString()
  productLabel?: string;

  @ApiPropertyOptional({ description: 'Xu hướng', enum: ['up', 'down', 'stable'], example: 'up' })
  @IsOptional()
  @IsIn(['up', 'down', 'stable'])
  trend?: ForecastTrend;

  @ApiPropertyOptional({ description: 'Phần trăm thay đổi', example: 5.2 })
  @IsOptional()
  @IsNumber()
  changePercent?: number;

  @ApiPropertyOptional({ description: 'Chuỗi thời gian giá/nhu cầu', type: () => [ForecastSeriesItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastSeriesItemDto)
  series?: ForecastSeriesItemDto[];

  @ApiPropertyOptional({ description: 'Giá dự báo tối thiểu (forecast loại price dạng khoảng)', example: 20000 })
  @IsOptional()
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Giá dự báo tối đa (forecast loại price dạng khoảng)', example: 25000 })
  @IsOptional()
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Mô tả (forecast loại weather)', example: 'Mưa lớn cuối tuần' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Mức rủi ro (weather)', enum: ['low', 'medium', 'high'], example: 'medium' })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  riskLevel?: ForecastRiskLevel;

  @ApiPropertyOptional({ description: 'Chi tiết bổ sung (weather)', example: 'Khuyến cáo che chắn vườn' })
  @IsOptional()
  @IsString()
  details?: string;
}
