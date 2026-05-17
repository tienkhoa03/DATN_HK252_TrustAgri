import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forecasts')
@Check(`"type" IN ('price', 'demand', 'weather')`)
@Check('"valid_to" > "valid_from"')
export class ForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_forecasts_trader_id')
  @Column({ name: 'trader_id', type: 'uuid' })
  traderId: string;

  @Column({ name: 'trader_display_name', type: 'varchar', nullable: true })
  traderDisplayName: string | null;

  @Index('idx_forecasts_region')
  @Column({ type: 'varchar', length: 128 })
  region: string;

  @Column({ name: 'crop_type', type: 'varchar', length: 128 })
  cropType: string;

  @Column({ type: 'varchar', length: 32 })
  type: 'price' | 'demand' | 'weather';

  @Column({ name: 'forecast_data', type: 'jsonb' })
  forecastData: unknown;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamptz' })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
