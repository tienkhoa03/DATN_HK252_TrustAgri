import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from './entities/contract.entity';
import { ContractAuditLogEntity } from './entities/contract-audit-log.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractAuditService } from './contract-audit.service';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity, ContractAuditLogEntity])],
  controllers: [ContractsController],
  providers: [ContractsService, ContractAuditService, ComplianceService],
  exports: [ContractsService, ContractAuditService, ComplianceService],
})
export class ContractsModule {}
