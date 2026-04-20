import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class ListStandardsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  ownerTraderId?: string;
}
