import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsModule } from '../contracts/contracts.module';
import { OrderEntity } from '../orders/entities/order.entity';
import { BuyingRequestEntity } from '../buying-requests/entities/buying-request.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ConnectionEntity } from '../connections/entities/connection.entity';
import { ProposalEntity } from '../proposals/entities/proposal.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      BuyingRequestEntity,
      ContractEntity,
      ConnectionEntity,
      ProposalEntity,
    ]),
    ContractsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
