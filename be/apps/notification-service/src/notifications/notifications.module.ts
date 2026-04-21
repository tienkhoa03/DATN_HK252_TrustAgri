import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ZnsAdapterService } from './services/zns-adapter.service';
import { FarmLookupService } from './services/farm-lookup.service';
import { RedisEventConsumerService } from './services/redis-event-consumer.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ZnsAdapterService,
    FarmLookupService,
    RedisEventConsumerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
