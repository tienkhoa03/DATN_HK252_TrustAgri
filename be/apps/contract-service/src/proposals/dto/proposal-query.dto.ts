import { IsOptional, IsIn, IsString } from 'class-validator';
import { PaginationQueryDto } from '@trustagri/shared';

export class ProposalQueryDto extends PaginationQueryDto {
  /** Lọc theo buying request */
  @IsOptional()
  @IsString()
  buyingRequestId?: string;

  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected'])
  status?: 'pending' | 'accepted' | 'rejected';
}
