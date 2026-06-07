import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StandardEntity } from './standard.entity';
import { SensorType } from '@trustagri/shared';

@Entity('standard_thresholds')
@Unique('uq_standard_thresholds_std_sensor', ['standardId', 'sensorType'])
export class StandardThresholdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'standard_id' })
  standardId: string;

  @ManyToOne(() => StandardEntity, (std) => std.thresholds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_id' })
  standard: StandardEntity;

  @Column({ name: 'sensor_type', type: 'varchar', length: 32 })
  sensorType: SensorType;

  @Column({ name: 'warning_min', type: 'float', nullable: true })
  warningMin: number | null;

  @Column({ name: 'warning_max', type: 'float', nullable: true })
  warningMax: number | null;

  @Column({ name: 'danger_min', type: 'float', nullable: true })
  dangerMin: number | null;

  @Column({ name: 'danger_max', type: 'float', nullable: true })
  dangerMax: number | null;
}
