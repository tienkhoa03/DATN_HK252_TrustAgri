import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SensorReadingDto } from '@trustagri/shared';

const SENSOR_TYPES: SensorReadingDto['sensorType'][] = [
  'temperature',
  'humidity',
  'light',
  'soil_moisture',
];

/**
 * Redis cache cho dữ liệu cảm biến mới nhất.
 * Key pattern: farm:{farmId}:sensor:{sensorType} → JSON SensorReadingDto
 */
@Injectable()
export class RedisSensorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisSensorService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });
    this.client.on('error', (err) =>
      this.logger.error('Redis client error', err),
    );
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Lấy snapshot mới nhất tất cả loại cảm biến của một vườn từ Redis.
   * Trả về mảng rỗng nếu chưa có dữ liệu (cần fallback InfluxDB).
   */
  async getLatest(farmId: string): Promise<SensorReadingDto[]> {
    const readings: SensorReadingDto[] = [];

    for (const sensorType of SENSOR_TYPES) {
      const key = `farm:${farmId}:sensor:${sensorType}`;
      const raw = await this.client.get(key).catch((err: Error) => {
        this.logger.warn(`Redis GET failed for ${key}: ${err.message}`);
        return null;
      });

      if (raw) {
        try {
          readings.push(JSON.parse(raw) as SensorReadingDto);
        } catch {
          this.logger.warn(`Invalid JSON at key ${key}`);
        }
      }
    }

    return readings;
  }

  /**
   * Ghi / cập nhật reading mới nhất của một cảm biến vào Redis.
   * Mặc định TTL 5 phút.
   */
  async setReading(
    reading: SensorReadingDto,
    ttlSeconds = 300,
  ): Promise<void> {
    const key = `farm:${reading.farmId}:sensor:${reading.sensorType}`;
    await this.client
      .set(key, JSON.stringify(reading), 'EX', ttlSeconds)
      .catch((err: Error) =>
        this.logger.error(`Redis SET failed for ${key}: ${err.message}`),
      );
  }
}
