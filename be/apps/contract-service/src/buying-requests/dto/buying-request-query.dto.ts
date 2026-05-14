import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class BuyingRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['open', 'matched', 'closed'], example: 'open' })
  @IsOptional()
  @IsIn(['open', 'matched', 'closed'])
  status?: 'open' | 'matched' | 'closed';

  @ApiPropertyOptional({ description: 'Filter by crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Filter by region', example: 'Mekong Delta' })
  @IsOptional()
  @IsString()
  region?: string;
}
