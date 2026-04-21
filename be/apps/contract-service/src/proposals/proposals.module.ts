import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalEntity } from './entities/proposal.entity';
import { BuyingRequestEntity } from '../buying-requests/entities/buying-request.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProposalEntity, BuyingRequestEntity, ContractEntity]),
    ContractsModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
