import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AlertQueryDto {
  @ApiPropertyOptional({ description: 'Filter by acknowledgement status', enum: ['unacknowledged', 'acknowledged', 'all'], example: 'unacknowledged' })
  @IsOptional()
  @IsIn(['unacknowledged', 'acknowledged', 'all'])
  status?: 'unacknowledged' | 'acknowledged' | 'all';

  @ApiPropertyOptional({ description: 'Filter by severity', enum: ['warning', 'danger'], example: 'danger' })
  @IsOptional()
  @IsIn(['warning', 'danger'])
  severity?: 'warning' | 'danger';

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
