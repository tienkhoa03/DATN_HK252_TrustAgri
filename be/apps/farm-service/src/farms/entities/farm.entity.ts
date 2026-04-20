import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export interface FarmLocation {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

@Entity('farms')
export class FarmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  location: FarmLocation;

  @Column({ type: 'float' })
  area: number;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Column({ name: 'standard_id', nullable: true })
  standardId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
