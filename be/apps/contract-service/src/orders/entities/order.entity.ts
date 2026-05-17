import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'contracted'
  | 'completed';

@Entity('orders')
@Check('"quantity" > 0')
@Check('"total_price" >= 0')
@Check('"deposit" IS NULL OR "deposit" >= 0')
@Check('"deposit" IS NULL OR "deposit" <= "total_price"')
@Check(`"status" IN ('pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed')`)
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_orders_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_orders_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  @Column({ name: 'buyer_display_name', type: 'varchar', nullable: true })
  buyerDisplayName: string | null;

  @Column({ name: 'buyer_phone', type: 'varchar', nullable: true })
  buyerPhone: string | null;

  @Column({ name: 'trader_display_name', type: 'varchar', nullable: true })
  traderDisplayName: string | null;

  @Column({ name: 'trader_phone', type: 'varchar', nullable: true })
  traderPhone: string | null;

  @Index('idx_orders_product_id')
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'total_price', type: 'numeric', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  deposit: number | null;

  @Index('idx_orders_status')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
