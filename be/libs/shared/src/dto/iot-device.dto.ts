import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type IotDeviceStatus = 'online' | 'offline';

/**
 * Phản hồi đầy đủ của một IoT node device (design.md §4.5 B1)
 */
export interface IotDeviceDto {
  id: string;
  farmId: string;
  farmName?: string | null;
  name: string;
  status: IotDeviceStatus;
  batteryLevel?: number | null;
  sensorTypes: string[];
  firmwareVersion?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tạo mới IoT node device cho một vườn
 */
export class CreateIotDeviceDto {
  @ApiProperty({ description: 'Device name', example: 'Node-A1 Field Sensor', minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @ApiProperty({ description: 'List of sensor types supported by this device', example: ['temperature', 'humidity'], minItems: 1 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  sensorTypes: string[];

  @ApiPropertyOptional({ description: 'Battery level percentage (0-100)', example: 87, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @ApiPropertyOptional({ description: 'Firmware version string', example: 'v1.2.3', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Device status', enum: ['online', 'offline'], example: 'online' })
  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}

/**
 * Cập nhật thông tin IoT node device (tất cả trường đều tuỳ chọn)
 */
export class UpdateIotDeviceDto {
  @ApiPropertyOptional({ description: 'Device name', example: 'Node-A1 Updated', minLength: 1, maxLength: 128 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated list of sensor types', example: ['temperature', 'humidity', 'soil_moisture'], minItems: 1 })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  sensorTypes?: string[];

  @ApiPropertyOptional({ description: 'Battery level percentage (0-100)', example: 62, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @ApiPropertyOptional({ description: 'Firmware version string', example: 'v1.3.0', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Device status', enum: ['online', 'offline'], example: 'offline' })
  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}

/**
 * Query params để lọc danh sách IoT node devices
 */
export class IotDeviceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by farm UUID', example: 'a1b2c3d4-e5f6-...' })
  @IsOptional()
  @IsUUID()
  farmId?: string;

  @ApiPropertyOptional({ description: 'Filter by device status', enum: ['online', 'offline'], example: 'online' })
  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}
