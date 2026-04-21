import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type BuyingRequestStatus = 'open' | 'matched' | 'closed';

@Entity('buying_requests')
export class BuyingRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'quality_standard_code', nullable: true, type: 'varchar' })
  qualityStandardCode: string | null;

  @Column({
    name: 'expected_price',
    nullable: true,
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  expectedPrice: number | null;

  @Column({
    name: 'deposit_offered',
    nullable: true,
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  depositOffered: number | null;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: BuyingRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
