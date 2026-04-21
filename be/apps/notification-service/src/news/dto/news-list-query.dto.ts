import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class NewsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
