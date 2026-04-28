import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class ListFarmsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
