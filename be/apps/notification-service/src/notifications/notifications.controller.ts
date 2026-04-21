import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
  ListResponse,
  NotificationDto,
} from '@trustagri/shared';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * GET /api/v1/notifications — design.md §4.2
   */
  @Get()
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
  readAll(@CurrentUser() user: JwtPayload): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.sub);
  }

  /**
   * POST /api/v1/notifications/:id/read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.notifications.markRead(user.sub, id);
  }
}
