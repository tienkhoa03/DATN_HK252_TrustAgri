import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class NewsListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by article category', example: 'market-news' })
  @IsOptional()
  @IsString()
  category?: string;
}
