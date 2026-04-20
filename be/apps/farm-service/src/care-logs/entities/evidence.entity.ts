import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CareLogEntity } from './care-log.entity';

@Entity('evidences')
export class EvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'care_log_id' })
  careLogId: string;

  @ManyToOne(() => CareLogEntity, (cl) => cl.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'care_log_id' })
  careLog: CareLogEntity;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
