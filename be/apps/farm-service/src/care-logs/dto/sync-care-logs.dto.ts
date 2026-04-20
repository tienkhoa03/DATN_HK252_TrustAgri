import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncCareLogItemDto {
  @IsString()
  clientRecordId: string;

  @IsOptional()
  @IsString()
  standardStepId?: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  performedAt: string;
}

export class SyncCareLogsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCareLogItemDto)
  items: SyncCareLogItemDto[];
}
