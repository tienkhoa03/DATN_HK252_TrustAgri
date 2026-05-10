import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
@Controller('monitoring/farms/:farmId')
@UseGuards(FarmAccessGuard)
export class FarmAlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('alerts')
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
@Controller('monitoring/alerts')
export class AlertsAcknowledgeController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post(':id/acknowledge')
  acknowledge(
    @Param('id') alertId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    return this.alertsService.acknowledgeAlert(alertId, user.sub);
  }
}
