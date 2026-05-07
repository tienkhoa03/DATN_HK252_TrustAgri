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

export type IotDeviceStatus = 'online' | 'offline';

/**
 * Phản hồi đầy đủ của một IoT node device (design.md §4.5 B1)
 */
export interface IotDeviceDto {
  id: string;
  farmId: string;
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
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  sensorTypes: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  firmwareVersion?: string;

  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}

/**
 * Cập nhật thông tin IoT node device (tất cả trường đều tuỳ chọn)
 */
export class UpdateIotDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  sensorTypes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  firmwareVersion?: string;

  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}

/**
 * Query params để lọc danh sách IoT node devices
 */
export class IotDeviceQueryDto {
  @IsOptional()
  @IsUUID()
  farmId?: string;

  @IsOptional()
  @IsIn(['online', 'offline'])
  status?: IotDeviceStatus;
}
