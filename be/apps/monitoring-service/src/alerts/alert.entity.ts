import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'sensor_type' })
  sensorType: string;

  @Column()
  severity: 'warning' | 'danger';

  @Column({ type: 'float' })
  threshold: number;

  @Column({ type: 'float' })
  value: number;

  @Column({ name: 'suggested_action', type: 'text', nullable: true })
  suggestedAction?: string;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
