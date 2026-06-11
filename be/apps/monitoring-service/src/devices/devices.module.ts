import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IotDeviceEntity } from './entities/iot-device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { FarmAccessGuard } from '../sensors/guards/farm-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([IotDeviceEntity])],
  controllers: [DevicesController],
  // FarmAccessGuard requires ConfigService (global via ClientsModule / ConfigModule).
  providers: [DevicesService, FarmAccessGuard],
  exports: [DevicesService],
})
export class DevicesModule {}
