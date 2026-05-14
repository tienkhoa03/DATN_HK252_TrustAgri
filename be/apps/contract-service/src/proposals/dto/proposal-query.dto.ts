import { IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

export class ProposalQueryDto extends PaginationQueryDto {
  /** Lọc theo buying request */
  @ApiPropertyOptional({ description: 'Filter by buying request ID', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  buyingRequestId?: string;

  @ApiPropertyOptional({ description: 'Filter by proposal status', enum: ['pending', 'accepted', 'rejected'], example: 'pending' })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected'])
  status?: 'pending' | 'accepted' | 'rejected';
}
