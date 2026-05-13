import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvidenceEntity } from './evidence.entity';
import { FarmEntity } from '../../farms/entities/farm.entity';
import { StandardStepEntity } from '../../standards/entities/standard-step.entity';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

@Entity('care_logs')
@Check(`"sync_status" IN ('synced', 'pending', 'conflict')`)
export class CareLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_care_logs_farm_id')
  @Column({ name: 'farm_id' })
  farmId: string;

  @ManyToOne(() => FarmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: FarmEntity;

  @Index('idx_care_logs_standard_step_id')
  @Column({ name: 'standard_step_id', nullable: true, type: 'varchar' })
  standardStepId: string | null;

  @ManyToOne(() => StandardStepEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'standard_step_id' })
  standardStep: StandardStepEntity | null;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index('idx_care_logs_performed_at')
  @Column({ name: 'performed_at', type: 'timestamptz' })
  performedAt: Date;

  @Column({ type: 'boolean', nullable: true, default: false })
  deviation: boolean | null;

  @Column({ name: 'sync_status', type: 'varchar', default: 'synced' })
  syncStatus: SyncStatus;

  @Column({ name: 'client_record_id', nullable: true, type: 'varchar', unique: true })
  clientRecordId: string | null;

  /** Cross-service FK → users.user_id (auth-service) — ai thực hiện hành động */
  @Index('idx_care_logs_performed_by')
  @Column({ name: 'performed_by', nullable: true, type: 'varchar' })
  performedBy: string | null;

  @OneToMany(() => EvidenceEntity, (e) => e.careLog, { cascade: true, eager: false })
  evidences: EvidenceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
