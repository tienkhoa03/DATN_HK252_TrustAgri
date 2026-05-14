import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ForecastListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by region', example: 'Mekong Delta' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by forecast type', enum: ['price', 'demand', 'weather'], example: 'price' })
  @IsOptional()
  @IsIn(['price', 'demand', 'weather'])
  type?: 'price' | 'demand' | 'weather';
}
