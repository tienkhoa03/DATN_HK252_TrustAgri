import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ProductStatus = 'active' | 'inactive';

@Entity('products')
@Check('"price" >= 0')
@Check('"stock_quantity" IS NULL OR "stock_quantity" >= 0')
@Check(`"status" IN ('active', 'inactive')`)
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   * DB-level FK enforced via manual SQL; TypeORM cannot define
   * @ManyToOne here because UserEntity lives in a separate service.
   */
  @Index('idx_products_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  /**
   * Cross-service FK → farms.id (farm-service).
   */
  @Index('idx_products_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ name: 'trader_display_name', type: 'varchar', nullable: true })
  traderDisplayName: string | null;

  @Column({ name: 'trader_phone', type: 'varchar', nullable: true })
  traderPhone: string | null;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

  /** Cross-service FK → contracts.id (source farmer_trader contract). */
  @Index('idx_products_source_contract_id')
  @Column({ name: 'source_contract_id', nullable: true, type: 'uuid' })
  sourceContractId: string | null;

  @Column({ name: 'standard_id', nullable: true, type: 'uuid' })
  standardId: string | null;

  @Column({ name: 'standard_name', type: 'varchar', nullable: true })
  standardName: string | null;

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

  @Index('idx_products_status')
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
