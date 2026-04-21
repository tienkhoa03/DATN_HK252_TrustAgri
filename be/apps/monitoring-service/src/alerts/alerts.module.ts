import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from './alert.entity';
import { AlertsService } from './alerts.service';
import {
  AlertsAcknowledgeController,
  FarmAlertsController,
} from './alerts.controller';
import { AlertPublisherService } from './services/alert-publisher.service';
import { FarmAccessGuard } from '../sensors/guards/farm-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AlertEntity])],
  controllers: [FarmAlertsController, AlertsAcknowledgeController],
  providers: [AlertsService, AlertPublisherService, FarmAccessGuard],
  exports: [AlertsService],
})
export class AlertsModule {}
