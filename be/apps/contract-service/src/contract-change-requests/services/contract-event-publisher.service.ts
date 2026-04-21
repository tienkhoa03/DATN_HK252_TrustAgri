import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  ContractChangeRequestDto,
  ContractDto,
} from '@trustagri/shared';

export const CONTRACT_CHANGED_CHANNEL = 'contract.changed';

/** Payload Redis Pub/Sub cho Notification Service (design.md — sự kiện contract.changed). */
export interface ContractChangedEventPayload {
  contract: ContractDto;
  changeRequest?: ContractChangeRequestDto;
}

/**
 * Publish contract.changed lên Redis để notification-service subscribe.
 */
@Injectable()
export class ContractEventPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContractEventPublisherService.name);
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
      this.logger.log('Contract event publisher Redis connected'),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
  }

  async publishContractChanged(
    payload: ContractChangedEventPayload,
  ): Promise<void> {
    try {
      await this.publisher.publish(
        CONTRACT_CHANGED_CHANNEL,
        JSON.stringify(payload),
      );
      this.logger.log(
        `Published ${CONTRACT_CHANGED_CHANNEL} for contract ${payload.contract.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish ${CONTRACT_CHANGED_CHANNEL}: ${(err as Error).message}`,
      );
    }
  }
}
