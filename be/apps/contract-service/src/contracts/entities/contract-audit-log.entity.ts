import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

/** Nhật ký thay đổi trạng thái hợp đồng (Task 12.1) */
@Entity('contract_audit_logs')
export class ContractAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_cal_contract_id')
  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @ManyToOne(() => ContractEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;

  @Column({ name: 'previous_status', type: 'varchar', length: 32, nullable: true })
  previousStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 32 })
  newStatus: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   * SET NULL preserves the audit trail even after a user is deleted.
   */
  @Index('idx_cal_actor_user_id')
  @Column({ name: 'actor_user_id', type: 'varchar', nullable: true })
  actorUserId: string | null;

  @Column({ name: 'actor_display_name', type: 'varchar', nullable: true })
  actorDisplayName: string | null;

  @Column({ name: 'actor_phone', type: 'varchar', nullable: true })
  actorPhone: string | null;

  @Index('idx_cal_occurred_at')
  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
