import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AlertDto } from '@trustagri/shared';

export const ALERT_CREATED_CHANNEL = 'alert.created';

/**
 * Publishes alert events to Redis Pub/Sub so Notification Service can subscribe.
 * Channel: alert.created
 * Payload: JSON-serialized AlertDto
 */
@Injectable()
export class AlertPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertPublisherService.name);
  private publisher: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.publisher = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });
    this.publisher.on('error', (err: Error) =>
      this.logger.error(`Redis publisher error: ${err.message}`),
    );
    this.publisher.on('connect', () =>
      this.logger.log('Alert publisher Redis connected'),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
  }

  async publishAlertCreated(alert: AlertDto): Promise<void> {
    try {
      await this.publisher.publish(
        ALERT_CREATED_CHANNEL,
        JSON.stringify(alert),
      );
      this.logger.log(
        `Published ${ALERT_CREATED_CHANNEL} for alert ${alert.id} (farm ${alert.farmId})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish ${ALERT_CREATED_CHANNEL}: ${(err as Error).message}`,
      );
    }
  }
}
