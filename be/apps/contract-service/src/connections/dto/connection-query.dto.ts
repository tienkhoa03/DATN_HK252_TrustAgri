import { IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectionQueryDto {
  /** Lọc theo hướng kết nối: incoming (nhận) hoặc outgoing (gửi) */
  @IsOptional()
  @IsIn(['incoming', 'outgoing'])
  role?: 'incoming' | 'outgoing';

  /** Lọc theo trạng thái */
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected'])
  status?: 'pending' | 'accepted' | 'rejected';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
