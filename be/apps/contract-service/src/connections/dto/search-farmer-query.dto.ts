import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchFarmerQueryDto {
  /** Lọc theo vùng địa lý (farmerProfile.region) */
  @IsOptional()
  @IsString()
  region?: string;

  /** Lọc theo loại cây trồng (join với bảng farms) */
  @IsOptional()
  @IsString()
  cropType?: string;

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
