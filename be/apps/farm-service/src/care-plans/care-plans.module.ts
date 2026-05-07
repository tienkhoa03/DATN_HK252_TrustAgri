import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmEntity } from '../farms/entities/farm.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { CarePlansController } from './care-plans.controller';
import { CarePlansService } from './care-plans.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FarmEntity,
      StandardEntity,
      StandardStepEntity,
      CareLogEntity,
    ]),
  ],
  controllers: [CarePlansController],
  providers: [CarePlansService],
})
export class CarePlansModule {}
