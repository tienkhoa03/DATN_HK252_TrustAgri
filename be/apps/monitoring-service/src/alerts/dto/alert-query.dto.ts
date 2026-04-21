import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AlertQueryDto {
  @IsOptional()
  @IsIn(['unacknowledged', 'acknowledged', 'all'])
  status?: 'unacknowledged' | 'acknowledged' | 'all';

  @IsOptional()
  @IsIn(['warning', 'danger'])
  severity?: 'warning' | 'danger';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
