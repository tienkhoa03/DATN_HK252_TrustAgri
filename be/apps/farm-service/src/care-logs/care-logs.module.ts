import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareLogEntity } from './entities/care-log.entity';
import { EvidenceEntity } from './entities/evidence.entity';
import { FarmEntity } from '../farms/entities/farm.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import { CareLogsController, EvidenceController } from './care-logs.controller';
import { CareLogsService } from './care-logs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareLogEntity,
      EvidenceEntity,
      FarmEntity,
      StandardStepEntity,
    ]),
  ],
  controllers: [CareLogsController, EvidenceController],
  providers: [CareLogsService],
  exports: [CareLogsService],
})
export class CareLogsModule {}
