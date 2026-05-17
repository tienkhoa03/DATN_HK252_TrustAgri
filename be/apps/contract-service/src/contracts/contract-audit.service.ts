import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ContractAuditLogEntity } from './entities/contract-audit-log.entity';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class ContractAuditService {
  constructor(
    @InjectRepository(ContractAuditLogEntity)
    private readonly auditRepo: Repository<ContractAuditLogEntity>,
    private readonly authClient: AuthClientService,
  ) {}

  /**
   * Ghi nhật ký mỗi khi trạng thái hợp đồng thay đổi (kể cả khởi tạo: previous = null).
   */
  async logStatusChange(
    contractId: string,
    previousStatus: string | null,
    newStatus: string,
    actorUserId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(ContractAuditLogEntity)
      : this.auditRepo;
    const nameRes = await Promise.allSettled([
      this.authClient.getUserDisplayName(actorUserId),
    ]);
    const row = repo.create({
      contractId,
      previousStatus,
      newStatus,
      actorUserId,
      actorDisplayName: settledValue(nameRes[0]),
    });
    await repo.save(row);
  }

  /** Lịch sử thay đổi trạng thái (thời gian tăng dần). */
  async findByContractId(contractId: string): Promise<ContractAuditLogEntity[]> {
    return this.auditRepo.find({
      where: { contractId },
      order: { occurredAt: 'ASC' },
    });
  }
}
