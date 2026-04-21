import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FarmEntity } from '../farms/entities/farm.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([FarmEntity, CareLogEntity, StandardEntity]),
  ],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
})
export class TraceabilityModule {}
