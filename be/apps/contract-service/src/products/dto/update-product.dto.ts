import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsIn,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Active farmer_trader contract ID to change source', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsUUID('4')
  sourceContractId?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Gao ST25 An Giang Premium' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Unit of sale', example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Price per unit in VND', example: 26000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Product image URLs', example: ['https://cdn.example.com/img1.jpg', 'https://cdn.example.com/img2.jpg'] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ description: 'Quality standard code', example: 'VietGAP-Rice-2024' })
  @IsOptional()
  @IsString()
  standardCode?: string;

  @ApiPropertyOptional({ description: 'Available stock quantity', example: 300, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Product description', example: 'Updated description for premium grade' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product status', enum: ['active', 'inactive'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
