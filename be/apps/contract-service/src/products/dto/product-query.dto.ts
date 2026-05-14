import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Filter by region', example: 'Mekong Delta' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Minimum price per unit in VND', example: 20000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price per unit in VND', example: 30000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Filter by trader user ID', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  traderId?: string;
}
