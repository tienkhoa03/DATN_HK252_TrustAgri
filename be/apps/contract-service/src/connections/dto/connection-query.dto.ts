import { IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectionQueryDto {
  /** Lọc theo hướng kết nối: incoming (nhận) hoặc outgoing (gửi) */
  @ApiPropertyOptional({ description: 'Filter by direction: incoming or outgoing', enum: ['incoming', 'outgoing'], example: 'incoming' })
  @IsOptional()
  @IsIn(['incoming', 'outgoing'])
  role?: 'incoming' | 'outgoing';

  /** Lọc theo trạng thái */
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'accepted', 'rejected'], example: 'pending' })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected'])
  status?: 'pending' | 'accepted' | 'rejected';

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
