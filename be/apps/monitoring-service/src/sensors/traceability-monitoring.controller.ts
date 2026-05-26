import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@trustagri/shared';
import { SensorsService } from './sensors.service';
import { RedisSensorService } from './services/redis-sensor.service';
import { TraceabilityInternalGuard } from './guards/traceability-internal.guard';

/**
 * Dữ liệu biểu đồ cảm biến cho trang truy xuất QR công khai (không JWT).
 * Được farm-service gọi nội bộ; Gateway vẫn áp rate limit theo IP.
 */
@ApiTags('traceability-monitoring')
@Controller('monitoring/traceability')
@Public()
@UseGuards(TraceabilityInternalGuard)
export class TraceabilityMonitoringController {
  constructor(
    private readonly sensorsService: SensorsService,
    private readonly redisSensor: RedisSensorService,
  ) {}

  /**
   * GET /api/v1/monitoring/traceability/farms/:farmId/sensor-chart
   * Query: from, to (ISO-8601). Mặc định 7 ngày gần nhất.
   */
  @Get('farms/:farmId/sensor-chart')
  @ApiOperation({ summary: 'Get sensor chart data for public QR traceability (no auth, internal only)' })
  @ApiResponse({ status: 200, description: 'Sensor chart series grouped by sensor type' })
  @ApiResponse({ status: 403, description: 'Forbidden - internal requests only' })
  getSensorChart(
    @Param('farmId') farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.sensorsService.getSensorChartForTraceability(
      farmId,
      fromDate.toISOString(),
      toDate.toISOString(),
    );
  }

  /**
   * GET /api/v1/monitoring/traceability/farms/:farmId/current-environment
   * Snapshot Redis mới nhất cho màn hình truy xuất công khai.
   * Nếu Redis miss → trả [] (FE ẩn card, không hiện lỗi — NFR-A01).
   */
  @Get('farms/:farmId/current-environment')
  @ApiOperation({ summary: 'Get current environment snapshot from Redis (internal only, no auth)' })
  @ApiResponse({ status: 200, description: 'Array of latest sensor readings; empty if Redis miss' })
  @ApiResponse({ status: 403, description: 'Forbidden - internal requests only' })
  async getCurrentEnvironment(@Param('farmId') farmId: string) {
    const readings = await this.redisSensor.getLatest(farmId);
    return readings.map((r) => ({
      sensorType: r.sensorType,
      value: r.value,
      recordedAt: r.recordedAt,
      isImputed: r.isImputed,
    }));
  }
}
