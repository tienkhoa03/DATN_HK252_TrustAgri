import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type ProductStatus = 'active' | 'inactive';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trader_id' })
  traderId: string;

  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column()
  name: string;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Column()
  unit: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ name: 'standard_code', nullable: true, type: 'varchar' })
  standardCode: string | null;

  @Column({ name: 'stock_quantity', nullable: true, type: 'int' })
  stockQuantity: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
