import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ListFarmsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by region', example: 'An Giang' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Filter by farm owner user ID', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Search keyword (farm name)', example: 'Mien Tay' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
