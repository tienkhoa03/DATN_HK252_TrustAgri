import { Module } from '@nestjs/common';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { RedisSensorService } from './services/redis-sensor.service';
import { InfluxSensorService } from './services/influx-sensor.service';
import { FarmAccessGuard } from './guards/farm-access.guard';
import { MonitoringGateway } from '../gateway/monitoring.gateway';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [SensorsController],
  providers: [
    SensorsService,
    RedisSensorService,
    InfluxSensorService,
    FarmAccessGuard,
    MonitoringGateway,
  ],
  exports: [SensorsService, RedisSensorService],
})
export class SensorsModule {}
