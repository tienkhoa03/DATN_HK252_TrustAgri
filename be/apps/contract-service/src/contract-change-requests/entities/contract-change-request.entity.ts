import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('contract_change_requests')
export class ContractChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @Column({ name: 'requested_by', type: 'varchar' })
  requestedBy: string;

  @Column({ type: 'jsonb' })
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: 'pending' | 'accepted' | 'rejected';

  @Column({ name: 'responded_by', type: 'varchar', nullable: true })
  respondedBy: string | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
