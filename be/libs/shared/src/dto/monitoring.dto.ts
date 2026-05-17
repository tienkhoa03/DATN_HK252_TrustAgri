import { IsString, IsOptional, IsBoolean, IsIn, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Giá trị cảm biến (design.md §4.5 SensorReadingDto)
 */
export interface SensorReadingDto {
  farmId: string;
  sensorType: 'temperature' | 'humidity' | 'light' | 'soil_moisture';
  value: number;
  unit: string;
  isImputed: boolean;
  recordedAt: string;
}

/**
 * Snapshot mới nhất của tất cả cảm biến trên một vườn
 */
export interface LatestSensorResponse {
  farmId: string;
  readings: SensorReadingDto[];
  updatedAt: string;
}

/**
 * Lịch sử cảm biến (query params)
 */
export class SensorHistoryQueryDto {
  @ApiProperty({ description: 'Start timestamp (ISO 8601)', example: '2024-03-01T00:00:00Z' })
  @IsString()
  from: string;

  @ApiProperty({ description: 'End timestamp (ISO 8601)', example: '2024-03-08T00:00:00Z' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ description: 'Aggregation interval (e.g. 1h, 30m)', example: '1h' })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({
    description: 'Sensor type to filter',
    enum: ['temperature', 'humidity', 'light', 'soil_moisture'],
    example: 'temperature',
  })
  @IsOptional()
  @IsIn(['temperature', 'humidity', 'light', 'soil_moisture'])
  sensorType?: 'temperature' | 'humidity' | 'light' | 'soil_moisture';
}

/**
 * Cảnh báo ngưỡng cảm biến (design.md §4.5 AlertDto)
 */
export interface AlertDto {
  id: string;
  farmId: string;
  farmName?: string | null;
  sensorType: string;
  severity: 'warning' | 'danger';
  threshold: number;
  value: number;
  suggestedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedByName?: string | null;
  acknowledgedByPhone?: string | null;
  acknowledgedAt?: string;
  createdAt: string;
}
