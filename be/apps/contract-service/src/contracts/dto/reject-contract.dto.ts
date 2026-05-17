import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectContractDto {
  @ApiPropertyOptional({ description: 'Lý do từ chối hợp đồng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
