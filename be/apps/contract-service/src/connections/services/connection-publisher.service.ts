import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ConnectionDto } from '@trustagri/shared';

export const CONNECTION_REQUESTED_CHANNEL = 'connection.requested';
export const CONNECTION_UPDATED_CHANNEL = 'connection.updated';

/**
 * Publishes connection events to Redis Pub/Sub so Notification Service can subscribe.
 * Channels: connection.requested, connection.updated
 * Payload: JSON-serialized ConnectionDto
 */
@Injectable()
export class ConnectionPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ConnectionPublisherService.name);
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
      this.logger.log('Connection publisher Redis connected'),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
  }

  async publishConnectionRequested(connection: ConnectionDto): Promise<void> {
    await this.publish(CONNECTION_REQUESTED_CHANNEL, connection);
  }

  async publishConnectionUpdated(connection: ConnectionDto): Promise<void> {
    await this.publish(CONNECTION_UPDATED_CHANNEL, connection);
  }

  private async publish(channel: string, payload: ConnectionDto): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(payload));
      this.logger.log(
        `Published ${channel} for connection ${payload.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish ${channel}: ${(err as Error).message}`,
      );
    }
  }
}
