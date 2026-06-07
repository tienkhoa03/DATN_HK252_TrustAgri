import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@trustagri/shared';

const NOTIFICATION_TYPES = ['alert', 'contract', 'connection', 'system', 'process'] as const;

/**
 * GET /api/v1/notifications — design.md §4.2
 */
export class NotificationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Return only unread notifications', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NOTIFICATION_TYPES,
    example: 'contract',
  })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];
}
