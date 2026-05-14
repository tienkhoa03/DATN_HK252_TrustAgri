import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  LatestSensorResponse,
  SensorHistoryQueryDto,
  SensorReadingDto,
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
 * Alert endpoints được chuyển sang AlertsModule (alerts.controller.ts)
 */
@ApiTags('sensors')
@ApiBearerAuth()
@Controller('monitoring/farms/:farmId')
@UseGuards(FarmAccessGuard)
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  /**
   * GET /api/v1/monitoring/farms/:farmId/latest
   * Snapshot mới nhất tất cả cảm biến — đọc Redis, fallback InfluxDB.
   */
  @Get('latest')
  @ApiOperation({ summary: 'Get latest sensor readings for a farm (Redis cache, fallback InfluxDB)' })
  @ApiResponse({ status: 200, description: 'Latest sensor snapshot with all sensor types' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this farm' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  getLatest(
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ): Promise<LatestSensorResponse> {
    return this.sensorsService.getLatest(farmId);
  }

  /**
   * GET /api/v1/monitoring/farms/:farmId/history
   * Lịch sử cảm biến theo khoảng thời gian.
   * Query params: from (required), to (required), interval (optional), sensorType (optional)
   */
  @Get('history')
  @ApiOperation({ summary: 'Get sensor history for a farm within a time range' })
  @ApiResponse({ status: 200, description: 'Array of sensor readings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this farm' })
  getHistory(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() query: SensorHistoryQueryDto,
  ): Promise<SensorReadingDto[]> {
    return this.sensorsService.getHistory(farmId, query);
  }
}
