import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  ListResponse,
  NotificationDto,
} from '@trustagri/shared';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * GET /api/v1/notifications — design.md §4.2
   */
  @Get()
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationListQueryDto,
  ): Promise<ListResponse<NotificationDto>> {
    return this.notifications.list(user.sub, query);
  }

  /**
   * POST /api/v1/notifications/read-all — phải khai báo trước :id/read
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Number of notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  readAll(@CurrentUser() user: JwtPayload): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.sub);
  }

  /**
   * POST /api/v1/notifications/:id/read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.notifications.markRead(user.sub, id);
  }
}
