import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FarmEntity } from './entities/farm.entity';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';

@Module({
  imports: [TypeOrmModule.forFeature([FarmEntity]), ConfigModule],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
