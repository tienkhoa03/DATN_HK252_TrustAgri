import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StandardEntity } from '../../standards/entities/standard.entity';

export interface FarmLocation {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

@Entity('farms')
@Check('"area" > 0')
export class FarmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   * DB-level constraint is enforced via migration SQL; TypeORM cannot
   * define a @ManyToOne here because UserEntity lives in a separate service.
   */
  @Index('idx_farms_owner_id')
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'owner_display_name', type: 'varchar', nullable: true })
  ownerDisplayName: string | null;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  location: FarmLocation;

  @Column({ type: 'float' })
  area: number;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Index('idx_farms_standard_id')
  @Column({ name: 'standard_id', nullable: true })
  standardId: string | null;

  @ManyToOne(() => StandardEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'standard_id' })
  standard: StandardEntity | null;

  /** Ngày trồng — dùng để tính cycleDay cho care plan */
  @Column({ name: 'planting_date', type: 'date', nullable: true })
  plantingDate: string | null;

  /** Mã QR truy xuất công khai (duy nhất); sinh khi tạo vườn */
  @Column({ name: 'traceability_code', nullable: true, unique: true })
  traceabilityCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
