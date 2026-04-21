import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Nhật ký thay đổi trạng thái hợp đồng (Task 12.1)
 */
@Entity('contract_audit_logs')
export class ContractAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 32, nullable: true })
  previousStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 32 })
  newStatus: string;

  @Column({ name: 'actor_user_id', type: 'varchar' })
  actorUserId: string;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
