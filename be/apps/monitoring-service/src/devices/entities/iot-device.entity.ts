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
import { IotDeviceStatus } from '@trustagri/shared';

/**
 * IoT node device — mỗi node có thể chứa nhiều loại cảm biến.
 * Khác với SensorDeviceEntity (sensor đơn lẻ), đây là đơn vị vật lý đại diện cho cả node.
 * Cross-service FK → farms.id được enforce ở DB layer, KHÔNG dùng TypeORM relation.
 */
@Entity('iot_devices')
@Check(`"status" IN ('online', 'offline')`)
export class IotDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Cross-service FK → farms.id (farm-service) */
  @Index('idx_iot_devices_farm_id')
  @Column({ name: 'farm_id', type: 'uuid' })
  farmId: string;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'offline' })
  status: IotDeviceStatus;

  @Column({ name: 'battery_level', type: 'int', nullable: true })
  batteryLevel: number | null;

  /** Mảng loại cảm biến mà node này hỗ trợ, ví dụ: ['temperature', 'humidity'] */
  @Column({ name: 'sensor_types', type: 'text', array: true })
  sensorTypes: string[];

  @Column({ name: 'firmware_version', type: 'varchar', length: 32, nullable: true })
  firmwareVersion: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Soft delete — không hard delete thiết bị IoT để giữ audit trail */
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
