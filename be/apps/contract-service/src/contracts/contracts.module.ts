import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from './entities/contract.entity';
import { ContractAuditLogEntity } from './entities/contract-audit-log.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { InternalContractsController } from './internal-contracts.controller';
import { ContractAuditService } from './contract-audit.service';
import { ComplianceService } from './compliance.service';
import { TraceabilityInternalGuard } from './internal.guard';
import { ConnectionsModule } from '../connections/connections.module';
import { ContractEventPublisherService } from '../contract-change-requests/services/contract-event-publisher.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ContractEntity, ContractAuditLogEntity]),
    ConnectionsModule,
  ],
  controllers: [ContractsController, InternalContractsController],
  providers: [
    ContractsService,
    ContractAuditService,
    ComplianceService,
    TraceabilityInternalGuard,
    ContractEventPublisherService,
  ],
  exports: [ContractsService, ContractAuditService, ComplianceService],
})
export class ContractsModule {}
