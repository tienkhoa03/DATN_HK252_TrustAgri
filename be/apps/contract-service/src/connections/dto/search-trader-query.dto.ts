import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchTraderQueryDto {
  /** Lọc theo vùng địa lý (traderProfile.region) */
  @IsOptional()
  @IsString()
  region?: string;

  /** Lọc theo loại cây trồng trader phụ trách (best-effort, so khớp với products) */
  @IsOptional()
  @IsString()
  cropType?: string;

  /** Điểm tin cậy tối thiểu (traderProfile.trustScore) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  trustScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
