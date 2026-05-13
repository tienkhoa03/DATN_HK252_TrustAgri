import { IsOptional, IsString, IsNumber, IsIn, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBuyingRequestDto {
  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  qualityStandardCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositOffered?: number;

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(['open', 'matched', 'closed'])
  status?: 'open' | 'matched' | 'closed';
}
