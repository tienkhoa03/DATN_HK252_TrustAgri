import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsArray,
  IsInt,
  IsDateString,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── FARM ──────────────────────────────────────────────────────────────────────

export interface FarmLocationDto {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

export class FarmLocationInputDto implements FarmLocationDto {
  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsString()
  addressLine: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

/**
 * Hồ sơ vườn (design.md §4.3 FarmDto)
 */
export interface FarmDto {
  id: string;
  ownerId: string;
  name: string;
  location: FarmLocationDto;
  area: number;
  cropType: string;
  standardId?: string;
  plantingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateFarmDto {
  @IsString()
  name: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => FarmLocationInputDto)
  location: FarmLocationInputDto;

  @IsNumber()
  area: number;

  @IsString()
  cropType: string;

  @IsOptional()
  @IsString()
  standardId?: string;

  @IsOptional()
  @IsDateString()
  plantingDate?: string;
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FarmLocationInputDto)
  location?: FarmLocationInputDto;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  standardId?: string;

  @IsOptional()
  @IsDateString()
  plantingDate?: string;
}

// ─── EVIDENCE ──────────────────────────────────────────────────────────────────

/**
 * Minh chứng (design.md §4.3 EvidenceDto)
 */
export interface EvidenceDto {
  id: string;
  careLogId: string;
  fileUrl: string;
  mimeType: string;
  capturedAt: string;
}

// ─── CARE LOG ──────────────────────────────────────────────────────────────────

/**
 * Nhật ký chăm sóc (design.md §4.3 CareLogDto)
 */
export interface CareLogDto {
  id: string;
  farmId: string;
  standardStepId?: string;
  action: string;
  notes?: string;
  performedAt: string;
  evidences: EvidenceDto[];
  deviation?: boolean;
  syncStatus: 'synced' | 'pending' | 'conflict';
  clientRecordId?: string;
}

export class CreateCareLogDto {
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

  @IsOptional()
  @IsString()
  clientRecordId?: string;
}

/**
 * Phản hồi đồng bộ batch offline (design.md §4.3 CareLogSyncResponse)
 */
export interface CareLogSyncResponse {
  results: Array<{
    clientRecordId: string;
    status: 'accepted' | 'conflicted' | 'rejected';
    serverId?: string;
    reason?: string;
  }>;
}

export class CreateEvidenceDto {
  @IsString()
  careLogId: string;

  @IsString()
  fileUrl: string;

  @IsString()
  mimeType: string;

  @IsString()
  capturedAt: string;
}

// ─── STANDARD ──────────────────────────────────────────────────────────────────

/**
 * Bước quy trình (design.md §4.3 StandardStepDto)
 */
export interface StandardStepDto {
  id: string;
  order: number;
  title: string;
  description: string;
  expectedDurationDays?: number;
  acceptanceCriteria?: string;
}

/**
 * Tiêu chuẩn canh tác (design.md §4.3 StandardDto)
 */
export interface StandardDto {
  id: string;
  code: string;
  name: string;
  description: string;
  ownerTraderId?: string;
  steps: StandardStepDto[];
  createdAt: string;
}

export class CreateStandardStepDto {
  @IsInt()
  order: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsInt()
  expectedDurationDays?: number;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}

export class CreateStandardDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardStepDto)
  steps?: CreateStandardStepDto[];
}

export class UpdateStandardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardStepDto)
  steps?: CreateStandardStepDto[];
}

// ─── TRACEABILITY ──────────────────────────────────────────────────────────────

/**
 * Truy xuất nguồn gốc QR (design.md §4.3 TraceabilityDto) — public endpoint
 */
export interface TraceabilityDto {
  productCode: string;
  farm: Pick<FarmDto, 'id' | 'name' | 'location' | 'cropType'>;
  standard?: Pick<StandardDto, 'code' | 'name'>;
  careLogTimeline: Array<Pick<CareLogDto, 'action' | 'performedAt' | 'notes'>>;
  sensorChart: Array<{
    sensorType: string;
    series: Array<{ t: string; value: number }>;
  }>;
}
