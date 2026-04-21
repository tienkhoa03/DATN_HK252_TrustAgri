import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CareLogEntity } from './care-log.entity';
import { FarmEntity } from '../../farms/entities/farm.entity';

@Entity('evidences')
export class EvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_evidences_care_log_id')
  @Column({ name: 'care_log_id' })
  careLogId: string;

  @ManyToOne(() => CareLogEntity, (cl) => cl.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'care_log_id' })
  careLog: CareLogEntity;

  @Index('idx_evidences_farm_id')
  @Column({ name: 'farm_id' })
  farmId: string;

  @ManyToOne(() => FarmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: FarmEntity;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
