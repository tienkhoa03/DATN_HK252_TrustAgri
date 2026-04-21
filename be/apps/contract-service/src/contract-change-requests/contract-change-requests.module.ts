import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ContractsModule } from '../contracts/contracts.module';
import { ContractChangeRequestEntity } from './entities/contract-change-request.entity';
import { ContractChangeRequestsController } from './contract-change-requests.controller';
import { ContractChangeRequestsService } from './contract-change-requests.service';
import { ContractEventPublisherService } from './services/contract-event-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractEntity, ContractChangeRequestEntity]),
    ContractsModule,
  ],
  controllers: [ContractChangeRequestsController],
  providers: [ContractChangeRequestsService, ContractEventPublisherService],
})
export class ContractChangeRequestsModule {}
