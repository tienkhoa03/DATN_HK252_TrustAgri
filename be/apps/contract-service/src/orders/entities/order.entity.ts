import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'contracted'
  | 'completed';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'trader_id' })
  traderId: string;

  @Column({ name: 'product_id' })
  productId: string;

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

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
