import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SensorDeviceType = 'temperature' | 'humidity' | 'light' | 'soil_moisture';

/**
 * Registry of physical IoT sensor devices.
 * Unique constraints on device_id and mac_address prevent duplicate registration.
 */
@Entity('sensor_devices')
@Check(`"sensor_type" IN ('temperature', 'humidity', 'light', 'soil_moisture')`)
export class SensorDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → farms.id (farm-service).
   */
  @Index('idx_sensor_devices_farm_id')
  @Column({ name: 'farm_id', type: 'uuid' })
  farmId: string;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

  /** Vendor-assigned device identifier / serial number. */
  @Column({ name: 'device_id', type: 'varchar', length: 64, unique: true })
  deviceId: string;

  /**
   * Hardware MAC address stored as PostgreSQL macaddr type.
   * PostgreSQL normalises the format automatically (e.g. "08:00:2b:01:02:03").
   */
  @Column({ name: 'mac_address', type: 'macaddr', unique: true })
  macAddress: string;

  @Column({ name: 'sensor_type', type: 'varchar', length: 32 })
  sensorType: SensorDeviceType;

  @Column({ name: 'firmware_version', type: 'varchar', length: 32, nullable: true })
  firmwareVersion: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
