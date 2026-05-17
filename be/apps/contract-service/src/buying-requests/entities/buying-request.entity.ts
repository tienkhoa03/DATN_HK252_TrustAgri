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

export type BuyingRequestStatus = 'open' | 'matched' | 'closed';

@Entity('buying_requests')
@Check('"quantity" > 0')
@Check('"expected_price" IS NULL OR "expected_price" >= 0')
@Check('"deposit_offered" IS NULL OR "deposit_offered" >= 0')
@Check(`"status" IN ('open', 'matched', 'closed')`)
export class BuyingRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_buying_requests_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'buyer_display_name', type: 'varchar', nullable: true })
  buyerDisplayName: string | null;

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

  /** Mô tả chi tiết nhu cầu mua (người mua nhập, trader đọc) */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_buying_requests_status')
  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: BuyingRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
