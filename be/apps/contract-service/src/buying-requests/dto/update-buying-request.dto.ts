import { IsOptional, IsString, IsNumber, IsIn, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBuyingRequestDto {
  @ApiPropertyOptional({ description: 'Crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Quantity needed', example: 1200, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit of quantity', example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Preferred quality standard code', example: 'VietGAP-Rice-2024' })
  @IsOptional()
  @IsString()
  qualityStandardCode?: string;

  @ApiPropertyOptional({ description: 'Expected price per unit in VND', example: 23000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedPrice?: number;

  @ApiPropertyOptional({ description: 'Deposit offered in VND', example: 5000000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositOffered?: number;

  @ApiPropertyOptional({ description: 'Required delivery date (ISO 8601)', example: '2024-07-31' })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Additional requirements (max 2000 chars)', example: 'Prefer no pesticides 30 days before harvest', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Request status', enum: ['open', 'matched', 'closed'], example: 'matched' })
  @IsOptional()
  @IsIn(['open', 'matched', 'closed'])
  status?: 'open' | 'matched' | 'closed';
}
