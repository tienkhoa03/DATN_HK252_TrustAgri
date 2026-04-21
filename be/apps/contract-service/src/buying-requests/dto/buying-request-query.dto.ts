import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class BuyingRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['open', 'matched', 'closed'])
  status?: 'open' | 'matched' | 'closed';

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  region?: string;
}
