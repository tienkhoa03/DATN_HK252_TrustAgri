import { Injectable } from '@nestjs/common';
import {
  SensorReadingDto,
  LatestSensorResponse,
  SensorHistoryQueryDto,
} from '@trustagri/shared';
import { RedisSensorService } from './services/redis-sensor.service';
import { InfluxSensorService } from './services/influx-sensor.service';
import { MonitoringGateway } from '../gateway/monitoring.gateway';

@Injectable()
export class SensorsService {
  constructor(
    private readonly redis: RedisSensorService,
    private readonly influx: InfluxSensorService,
    private readonly gateway: MonitoringGateway,
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
   * Ghi một reading mới vào Redis và push WebSocket sensor_update.
   * Dùng khi có data ingestion pipeline (MQTT, HTTP ingestion, v.v.)
   */
  async ingestReading(reading: SensorReadingDto): Promise<void> {
    await this.redis.setReading(reading);
    this.gateway.pushSensorUpdate(reading.farmId, reading);
  }
}
