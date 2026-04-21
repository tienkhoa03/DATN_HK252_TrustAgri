import { Injectable } from '@nestjs/common';
import {
  LatestSensorResponse,
  SensorReadingDto,
  SensorHistoryQueryDto,
} from '@trustagri/shared';
import { RedisSensorService } from './services/redis-sensor.service';
import { InfluxSensorService } from './services/influx-sensor.service';
import { MonitoringGateway } from '../gateway/monitoring.gateway';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class SensorsService {
  constructor(
    private readonly redis: RedisSensorService,
    private readonly influx: InfluxSensorService,
    private readonly gateway: MonitoringGateway,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Trả về snapshot mới nhất: đọc Redis trước, fallback InfluxDB.
   */
  async getLatest(farmId: string): Promise<LatestSensorResponse> {
    let readings = await this.redis.getLatest(farmId);

    if (readings.length === 0) {
      readings = await this.influx.getLatest(farmId);
    }

    return {
      farmId,
      readings,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Lấy lịch sử cảm biến theo khoảng thời gian từ InfluxDB.
   */
  async getHistory(
    farmId: string,
    query: SensorHistoryQueryDto,
  ): Promise<SensorReadingDto[]> {
    return this.influx.getHistory(
      farmId,
      query.from,
      query.to,
      query.interval,
      query.sensorType,
    );
  }

  /**
   * Gom nhóm lịch sử theo để vẽ biểu đồ công khai (TraceabilityDto.sensorChart).
   */
  async getSensorChartForTraceability(
    farmId: string,
    fromIso: string,
    toIso: string,
  ): Promise<
    Array<{ sensorType: string; series: Array<{ t: string; value: number }> }>
  > {
    const readings = await this.getHistory(farmId, {
      from: fromIso,
      to: toIso,
      interval: '1h',
    });
    const map = new Map<string, Array<{ t: string; value: number }>>();
    for (const r of readings) {
      const key = r.sensorType;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ t: r.recordedAt, value: r.value });
    }
    for (const series of map.values()) {
      series.sort(
        (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
      );
    }
    return Array.from(map.entries()).map(([sensorType, series]) => ({
      sensorType,
      series,
    }));
  }

  /**
   * Ghi một reading mới vào Redis, push WebSocket sensor_update,
   * và kiểm tra ngưỡng để tạo alert nếu cần.
   * Dùng khi có data ingestion pipeline (MQTT, HTTP ingestion, v.v.)
   */
  async ingestReading(reading: SensorReadingDto): Promise<void> {
    await this.redis.setReading(reading);
    this.gateway.pushSensorUpdate(reading.farmId, reading);
    await this.alertsService.checkAndCreateAlert(reading);
  }
}
