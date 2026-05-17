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

@Entity('trader_reviews')
@Check('"rating" BETWEEN 1 AND 5')
// Partial unique (buyer_id, order_id) WHERE order_id IS NOT NULL enforced via production migration;
// @Index unique covers non-null pairs acceptably in dev sync mode
@Index('idx_trader_reviews_buyer_order', ['buyerId', 'orderId'], { unique: true })
export class TraderReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Cross-service FK → users.user_id (auth-service)
  @Index('idx_trader_reviews_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  // Cross-service FK → users.user_id (auth-service)
  @Index('idx_trader_reviews_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'trader_display_name', type: 'varchar', nullable: true })
  traderDisplayName: string | null;

  @Column({ name: 'trader_phone', type: 'varchar', nullable: true })
  traderPhone: string | null;

  @Column({ name: 'buyer_display_name', type: 'varchar', nullable: true })
  buyerDisplayName: string | null;

  @Column({ name: 'buyer_phone', type: 'varchar', nullable: true })
  buyerPhone: string | null;

  // FK → orders.id ON DELETE SET NULL; nullable (review may be freeform without order)
  @Column({ name: 'order_id', nullable: true, type: 'uuid' })
  orderId: string | null;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
