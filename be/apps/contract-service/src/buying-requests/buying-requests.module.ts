import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyingRequestEntity } from './entities/buying-request.entity';
import { BuyingRequestsService } from './buying-requests.service';
import { BuyingRequestsController } from './buying-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BuyingRequestEntity])],
  controllers: [BuyingRequestsController],
  providers: [BuyingRequestsService],
  exports: [BuyingRequestsService],
})
export class BuyingRequestsModule {}
