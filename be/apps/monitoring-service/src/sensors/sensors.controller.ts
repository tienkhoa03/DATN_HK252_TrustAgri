import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  SensorReadingDto,
  LatestSensorResponse,
  SensorHistoryQueryDto,
} from '@trustagri/shared';
import { SensorsService } from './sensors.service';
import { FarmAccessGuard } from './guards/farm-access.guard';

/**
 * Endpoints giám sát cảm biến của vườn (design.md §4.5)
 *
 * GET /api/v1/monitoring/farms/:farmId/latest
 * GET /api/v1/monitoring/farms/:farmId/history
 *
 * Phân quyền: chủ nông trại | thương lái có hợp đồng | người mua có order/hợp đồng
 */
@Controller('monitoring/farms/:farmId')
@UseGuards(FarmAccessGuard)
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  /**
   * GET /api/v1/monitoring/farms/:farmId/latest
   * Snapshot mới nhất tất cả cảm biến — đọc Redis, fallback InfluxDB.
   */
  @Get('latest')
  getLatest(
    @Param('farmId') farmId: string,
  ): Promise<LatestSensorResponse> {
    return this.sensorsService.getLatest(farmId);
  }

  /**
   * GET /api/v1/monitoring/farms/:farmId/history
   * Lịch sử cảm biến theo khoảng thời gian.
   * Query params: from (required), to (required), interval (optional, mặc định 1h), sensorType (optional)
   */
  @Get('history')
  getHistory(
    @Param('farmId') farmId: string,
    @Query() query: SensorHistoryQueryDto,
  ): Promise<SensorReadingDto[]> {
    return this.sensorsService.getHistory(farmId, query);
  }
}
