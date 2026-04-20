import { IsString, IsOptional, IsBoolean, IsIn, IsNumber } from 'class-validator';

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
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  interval?: string;

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
  sensorType: string;
  severity: 'warning' | 'danger';
  threshold: number;
  value: number;
  suggestedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}
