import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class ForecastListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsIn(['price', 'demand', 'weather'])
  type?: 'price' | 'demand' | 'weather';
}
