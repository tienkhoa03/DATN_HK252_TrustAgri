import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

/**
 * GET /api/v1/notifications — design.md §4.2
 */
export class NotificationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Return only unread notifications', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unreadOnly?: boolean;
}
