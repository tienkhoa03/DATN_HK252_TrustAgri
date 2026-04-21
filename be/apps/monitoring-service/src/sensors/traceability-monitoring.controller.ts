import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Public } from '@trustagri/shared';
import { SensorsService } from './sensors.service';
import { TraceabilityInternalGuard } from './guards/traceability-internal.guard';

/**
 * Dữ liệu biểu đồ cảm biến cho trang truy xuất QR công khai (không JWT).
 * Được farm-service gọi nội bộ; Gateway vẫn áp rate limit theo IP.
 */
@Controller('monitoring/traceability')
@Public()
@UseGuards(TraceabilityInternalGuard)
export class TraceabilityMonitoringController {
  constructor(private readonly sensorsService: SensorsService) {}

  /**
   * GET /api/v1/monitoring/traceability/farms/:farmId/sensor-chart
   * Query: from, to (ISO-8601). Mặc định 7 ngày gần nhất.
   */
  @Get('farms/:farmId/sensor-chart')
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
}
