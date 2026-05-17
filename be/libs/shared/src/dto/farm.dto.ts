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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── FARM ──────────────────────────────────────────────────────────────────────

export interface FarmLocationDto {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

export class FarmLocationInputDto implements FarmLocationDto {
  @ApiProperty({ description: 'Province name', example: 'An Giang' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'District name', example: 'Long Xuyen' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'Full address line', example: '123 Quoc Lo 1, Phuong My Xuyen' })
  @IsString()
  addressLine: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 10.3789 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 105.4356 })
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
  ownerDisplayName?: string | null;
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
  @ApiProperty({ description: 'Farm name', example: 'Vuon Lua Mien Tay' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Farm location', type: () => FarmLocationInputDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => FarmLocationInputDto)
  location: FarmLocationInputDto;

  @ApiProperty({ description: 'Farm area in hectares', example: 2.5 })
  @IsNumber()
  area: number;

  @ApiProperty({ description: 'Crop type grown on this farm', example: 'rice' })
  @IsString()
  cropType: string;

  @ApiPropertyOptional({ description: 'Standard ID applied to this farm', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  standardId?: string;

  @ApiPropertyOptional({ description: 'Planting date (ISO 8601)', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  plantingDate?: string;
}

export class UpdateFarmDto {
  @ApiPropertyOptional({ description: 'Farm name', example: 'Vuon Lua Mien Tay' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Farm location', type: () => FarmLocationInputDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FarmLocationInputDto)
  location?: FarmLocationInputDto;

  @ApiPropertyOptional({ description: 'Farm area in hectares', example: 3.0 })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ description: 'Crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Standard ID applied to this farm', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  standardId?: string;

  @ApiPropertyOptional({ description: 'Planting date (ISO 8601)', example: '2024-01-15' })
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
  performedBy?: string;
  performedByName?: string | null;
  evidences: EvidenceDto[];
  deviation?: boolean;
  syncStatus: 'synced' | 'pending' | 'conflict';
  clientRecordId?: string;
}

export class CreateCareLogDto {
  @ApiPropertyOptional({ description: 'Standard step ID this care log corresponds to', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  standardStepId?: string;

  @ApiProperty({ description: 'Action performed (e.g. watering, fertilizing)', example: 'Applied NPK fertilizer 20kg/ha' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Weather was sunny, soil moist' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ISO 8601 timestamp when the action was performed', example: '2024-03-15T08:30:00Z' })
  @IsString()
  performedAt: string;

  @ApiPropertyOptional({ description: 'Client-generated UUID for idempotent offline sync', example: 'client-uuid-abc-123' })
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
  @ApiProperty({ description: 'Care log ID this evidence belongs to', example: 'a1b2c3d4-...' })
  @IsString()
  careLogId: string;

  @ApiProperty({ description: 'File URL (pre-uploaded by client)', example: 'https://cdn.example.com/evidence/photo.jpg' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'ISO 8601 timestamp when photo/evidence was captured', example: '2024-03-15T08:25:00Z' })
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
  cropType?: string;
  version: number;
  ownerTraderId?: string;
  ownerTraderName?: string | null;
  steps: StandardStepDto[];
  createdAt: string;
  updatedAt: string;
}

export class CreateStandardStepDto {
  @ApiProperty({ description: 'Step order (1-based)', example: 1 })
  @IsInt()
  order: number;

  @ApiProperty({ description: 'Step title', example: 'Land preparation' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the step', example: 'Plow and harrow the field to 20cm depth' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Expected duration in days', example: 3 })
  @IsOptional()
  @IsInt()
  expectedDurationDays?: number;

  @ApiPropertyOptional({ description: 'Acceptance criteria for this step', example: 'Field surface is level, no clumps > 5cm' })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}

export class CreateStandardDto {
  @ApiProperty({ description: 'Unique standard code', example: 'VietGAP-Rice-2024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Standard name', example: 'VietGAP Rice Cultivation Standard 2024' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Standard description', example: 'Comprehensive rice cultivation standard following VietGAP guidelines' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Crop type this standard applies to', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'List of cultivation steps', type: () => [CreateStandardStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardStepDto)
  steps?: CreateStandardStepDto[];
}

export class UpdateStandardDto {
  @ApiPropertyOptional({ description: 'Standard name', example: 'VietGAP Rice Cultivation Standard 2024 v2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Standard description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Updated list of cultivation steps', type: () => [CreateStandardStepDto] })
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
