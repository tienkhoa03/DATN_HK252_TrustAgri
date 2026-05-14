import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncCareLogItemDto {
  @ApiProperty({ description: 'Client-generated UUID for idempotent sync', example: 'client-uuid-abc-123' })
  @IsString()
  clientRecordId: string;

  @ApiPropertyOptional({ description: 'Standard step ID this care log corresponds to', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  standardStepId?: string;

  @ApiProperty({ description: 'Action performed', example: 'Applied fertilizer NPK 20kg/ha' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Sunny weather, soil moisture OK' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ISO 8601 timestamp when action was performed', example: '2024-03-15T08:30:00Z' })
  @IsString()
  performedAt: string;
}

export class SyncCareLogsDto {
  @ApiProperty({ description: 'List of offline care log records to sync', type: () => [SyncCareLogItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCareLogItemDto)
  items: SyncCareLogItemDto[];
}
