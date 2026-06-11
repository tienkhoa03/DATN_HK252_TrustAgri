import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisOptionsFromEnv } from '@trustagri/shared';

export const PROCESS_EVENT_CHANNEL = 'process.event';

export interface ProcessEventPayload {
  kind: 'careplan_due' | 'compliance_violation';
  userId: string;
  farmId?: string;
  title: string;
  body: string;
  linkTo?: string;
  severity: 'info' | 'warning' | 'danger';
}

/**
 * Publish process.event lên Redis để notification-service subscribe (FR-M04, quy trình).
 * Channel: process.event, payload: ProcessEventPayload JSON.
 */
@Injectable()
export class ProcessEventPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ProcessEventPublisherService.name);
  private publisher: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.publisher = new Redis({
      ...redisOptionsFromEnv(),
      lazyConnect: true,
    });
    this.publisher.on('error', (err: Error) =>
      this.logger.error(`Redis publisher error: ${err.message}`),
    );
    this.publisher.on('connect', () =>
      this.logger.log('Process event publisher Redis connected'),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
  }

  async publishProcessEvent(payload: ProcessEventPayload): Promise<void> {
    try {
      await this.publisher.publish(PROCESS_EVENT_CHANNEL, JSON.stringify(payload));
      this.logger.log(
        `Published ${PROCESS_EVENT_CHANNEL} kind=${payload.kind} for user ${payload.userId}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish ${PROCESS_EVENT_CHANNEL}: ${(err as Error).message}`,
      );
    }
  }
}
