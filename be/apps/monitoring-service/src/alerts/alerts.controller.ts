import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AlertDto,
  CurrentUser,
  JwtPayload,
  ListResponse,
} from '@trustagri/shared';
import { AlertsService } from './alerts.service';
import { AlertQueryDto } from './dto/alert-query.dto';
import { FarmAccessGuard } from '../sensors/guards/farm-access.guard';

/**
 * GET /api/v1/monitoring/farms/:farmId/alerts
 * Danh sách cảnh báo của vườn — lọc status, severity, phân trang.
 * Phân quyền: chủ nông trại | thương lái có hợp đồng | người mua có order/hợp đồng.
 */
@ApiTags('alerts')
@ApiBearerAuth()
@Controller('monitoring/farms/:farmId')
@UseGuards(FarmAccessGuard)
export class FarmAlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'List alerts for a farm filtered by status and severity' })
  @ApiResponse({ status: 200, description: 'Paginated list of alerts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this farm' })
  listAlerts(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() query: AlertQueryDto,
  ): Promise<ListResponse<AlertDto>> {
    return this.alertsService.listAlerts(farmId, query);
  }
}

/**
 * POST /api/v1/monitoring/alerts/:id/acknowledge
 * Xác nhận đã xem cảnh báo — bất kỳ user có quyền truy cập đều có thể acknowledge.
 */
@ApiTags('alerts')
@ApiBearerAuth()
@Controller('monitoring/alerts')
export class AlertsAcknowledgeController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert (marks it as seen)' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  acknowledge(
    @Param('id') alertId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    return this.alertsService.acknowledgeAlert(alertId, user.sub);
  }
}
