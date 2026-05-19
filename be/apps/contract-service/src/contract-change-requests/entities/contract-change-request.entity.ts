import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContractEntity } from '../../contracts/entities/contract.entity';

export type ContractChangeAction = 'modify' | 'cancel' | 'complete';

@Entity('contract_change_requests')
@Check(`"status" IN ('pending', 'accepted', 'rejected')`)
@Check(`"action" IN ('modify', 'cancel', 'complete')`)
export class ContractChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_ccr_contract_id')
  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @ManyToOne(() => ContractEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;

  /**
   * Loại yêu cầu: modify (điều chỉnh field), cancel (hủy), complete (hoàn thành).
   */
  @Column({ type: 'varchar', length: 20, default: 'modify' })
  action: ContractChangeAction;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_ccr_requested_by')
  @Column({ name: 'requested_by', type: 'varchar' })
  requestedBy: string;

  @Column({ name: 'requested_by_name', type: 'varchar', nullable: true })
  requestedByName: string | null;

  @Column({ name: 'requested_by_phone', type: 'varchar', nullable: true })
  requestedByPhone: string | null;

  @Column({ type: 'jsonb' })
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: 'pending' | 'accepted' | 'rejected';

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Column({ name: 'responded_by', type: 'varchar', nullable: true })
  respondedBy: string | null;

  @Column({ name: 'responded_by_name', type: 'varchar', nullable: true })
  respondedByName: string | null;

  @Column({ name: 'responded_by_phone', type: 'varchar', nullable: true })
  respondedByPhone: string | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
