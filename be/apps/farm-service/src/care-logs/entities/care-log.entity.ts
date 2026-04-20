import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EvidenceEntity } from './evidence.entity';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

@Entity('care_logs')
export class CareLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'standard_step_id', nullable: true, type: 'varchar' })
  standardStepId: string | null;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'performed_at', type: 'timestamptz' })
  performedAt: Date;

  @Column({ type: 'boolean', nullable: true, default: false })
  deviation: boolean | null;

  @Column({ name: 'sync_status', type: 'varchar', default: 'synced' })
  syncStatus: SyncStatus;

  @Column({ name: 'client_record_id', nullable: true, type: 'varchar', unique: true })
  clientRecordId: string | null;

  @OneToMany(() => EvidenceEntity, (e) => e.careLog, { cascade: true, eager: false })
  evidences: EvidenceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
