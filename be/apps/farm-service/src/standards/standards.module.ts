import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandardEntity } from './entities/standard.entity';
import { StandardStepEntity } from './entities/standard-step.entity';
import { StandardThresholdEntity } from './entities/standard-threshold.entity';
import { StandardsController } from './standards.controller';
import { StandardsService } from './standards.service';
import { StandardsSeeder } from './standards.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([StandardEntity, StandardStepEntity, StandardThresholdEntity])],
  controllers: [StandardsController],
  providers: [StandardsService, StandardsSeeder],
  exports: [StandardsService],
})
export class StandardsModule {}
