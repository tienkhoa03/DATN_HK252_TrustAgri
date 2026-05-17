import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('alerts')
@Check(`"severity" IN ('warning', 'danger')`)
@Check('"threshold" >= 0')
@Check(`
  ("sensor_type" = 'humidity'      AND "value" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'soil_moisture' AND "value" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'temperature'   AND "value" BETWEEN -50 AND 60)   OR
  ("sensor_type" = 'light'         AND "value" BETWEEN 0 AND 200000) OR
  "sensor_type" NOT IN ('humidity', 'soil_moisture', 'temperature', 'light')
`)
@Check(`
  ("sensor_type" = 'humidity'      AND "threshold" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'soil_moisture' AND "threshold" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'temperature'   AND "threshold" BETWEEN -50 AND 60)   OR
  ("sensor_type" = 'light'         AND "threshold" BETWEEN 0 AND 200000) OR
  "sensor_type" NOT IN ('humidity', 'soil_moisture', 'temperature', 'light')
`)
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → farms.id (farm-service).
   */
  @Index('idx_alerts_farm_id')
  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

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

  @Index('idx_alerts_acknowledged')
  @Column({ default: false })
  acknowledged: boolean;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'acknowledged_by_name', type: 'varchar', nullable: true })
  acknowledgedByName: string | null;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
