import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AlertDto, ConnectionDto } from '@trustagri/shared';
import {
  ContractChangedEventPayload,
  NotificationsService,
  REDIS_CHANNEL_ALERT_CREATED,
  REDIS_CHANNEL_CONNECTION_REQUESTED,
  REDIS_CHANNEL_CONTRACT_CHANGED,
} from '../notifications.service';

/**
 * Subscribe Redis Pub/Sub: alert.created, contract.changed, connection.requested
 */
@Injectable()
export class RedisEventConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisEventConsumerService.name);
  private subscriber?: Redis;
  private subscribed = false;

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.subscriber = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });

    this.subscriber.on('error', (err: Error) =>
      this.logger.error(`Redis subscriber error: ${err.message}`),
    );
    this.subscriber.on('connect', () =>
      this.logger.log('Redis subscriber connected'),
    );
    this.subscriber.on('end', () => {
      this.subscribed = false;
      this.logger.warn('Redis subscriber disconnected — scheduling reconnect');
      void this.subscribeWithRetry();
    });
    this.subscriber.on('close', () => {
      this.subscribed = false;
    });

    void this.subscribeWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
  }

  private async subscribeWithRetry(attempt = 1): Promise<void> {
    try {
      await this.subscribeChannels();
      this.subscribed = true;
    } catch (err) {
      const delay = Math.min(30_000, 1000 * 2 ** attempt);
      this.logger.warn(
        `Redis subscribe failed (attempt ${attempt}), retrying in ${delay}ms: ${(err as Error).message}`,
      );
      setTimeout(() => void this.subscribeWithRetry(attempt + 1), delay);
    }
  }

  private async subscribeChannels(): Promise<void> {
    const sub = this.subscriber;
    if (!sub) return;

    await sub.subscribe(
      REDIS_CHANNEL_ALERT_CREATED,
      REDIS_CHANNEL_CONTRACT_CHANGED,
      REDIS_CHANNEL_CONNECTION_REQUESTED,
    );

    sub.on('message', (channel, message) => {
      void this.dispatch(channel, message).catch((e) =>
        this.logger.error(
          `Handler ${channel} error: ${(e as Error).message}`,
        ),
      );
    });

    this.logger.log(
      `Subscribed to ${REDIS_CHANNEL_ALERT_CREATED}, ${REDIS_CHANNEL_CONTRACT_CHANGED}, ${REDIS_CHANNEL_CONNECTION_REQUESTED}`,
    );
  }

  private async dispatch(channel: string, message: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      this.logger.warn(`Invalid JSON on ${channel}`);
      return;
    }

    if (channel === REDIS_CHANNEL_ALERT_CREATED) {
      await this.notifications.handleAlertCreated(parsed as AlertDto);
      return;
    }
    if (channel === REDIS_CHANNEL_CONTRACT_CHANGED) {
      await this.notifications.handleContractChanged(
        parsed as ContractChangedEventPayload,
      );
      return;
    }
    if (channel === REDIS_CHANNEL_CONNECTION_REQUESTED) {
      await this.notifications.handleConnectionRequested(parsed as ConnectionDto);
      return;
    }
  }
}
