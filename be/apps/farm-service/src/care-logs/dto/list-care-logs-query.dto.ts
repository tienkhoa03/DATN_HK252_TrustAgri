import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCareLogsQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by standard step ID', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  standardStepId?: string;

  @ApiPropertyOptional({ description: 'Filter by contract ID (trader_buyer contract)', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  contractId?: string;
}
