import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type CareAuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Entity('care_audit_logs')
export class CareAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_care_audit_care_log_id')
  @Column({ name: 'care_log_id', type: 'uuid' })
  careLogId: string;

  @Column({ type: 'varchar', length: 16 })
  action: CareAuditAction;

  @Column({ name: 'changed_by', type: 'varchar', length: 64, nullable: true })
  changedBy: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, unknown> | null;

  @Index('idx_care_audit_changed_at')
  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
}
