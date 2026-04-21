import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from '../../orders/entities/order.entity';
import { ProposalEntity } from '../../proposals/entities/proposal.entity';
import { ProductEntity } from '../../products/entities/product.entity';

export type ContractStatus = 'active' | 'pending_change' | 'completed' | 'cancelled';
export type ContractType = 'farmer_trader' | 'trader_buyer';

@Entity('contracts')
@Check('"quantity" > 0')
@Check('"total_price" >= 0')
@Check('"deposit" IS NULL OR "deposit" >= 0')
@Check('"deposit" IS NULL OR "deposit" <= "total_price"')
@Check(`"status" IN ('active', 'pending_change', 'completed', 'cancelled')`)
@Check(`"contract_type" IN ('farmer_trader', 'trader_buyer')`)
@Check('"end_date" >= "start_date"')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service). Nullable — farmer_trader
   * contracts may omit the farmer side initially.
   */
  @Index('idx_contracts_party_farmer_id')
  @Column({ name: 'party_farmer_id', nullable: true, type: 'varchar' })
  partyFarmerId: string | null;

  /**
   * Cross-service FK → users.user_id (auth-service). Required.
   */
  @Index('idx_contracts_party_trader_id')
  @Column({ name: 'party_trader_id' })
  partyTraderId: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_contracts_party_buyer_id')
  @Column({ name: 'party_buyer_id', nullable: true, type: 'varchar' })
  partyBuyerId: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 20 })
  contractType: ContractType;

  @Index('idx_contracts_product_id')
  @Column({ name: 'product_id', nullable: true, type: 'varchar' })
  productId: string | null;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null;

  /**
   * Cross-service FK → standards.id (farm-service).
   */
  @Column({ name: 'standard_id', nullable: true, type: 'varchar' })
  standardId: string | null;

  /**
   * Cross-service FK → farms.id (farm-service).
   */
  @Index('idx_contracts_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'total_price', type: 'numeric', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  deposit: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Index('idx_contracts_status')
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ContractStatus;

  @Column({ type: 'text', default: '' })
  terms: string;

  /** Tham chiếu đơn hàng tạo ra hợp đồng này (nếu có) */
  @Index('idx_contracts_order_id')
  @Column({ name: 'order_id', nullable: true, type: 'varchar' })
  orderId: string | null;

  @ManyToOne(() => OrderEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity | null;

  /** Tham chiếu đề xuất tạo ra hợp đồng này (nếu có) */
  @Column({ name: 'proposal_id', nullable: true, type: 'varchar' })
  proposalId: string | null;

  @ManyToOne(() => ProposalEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposal_id' })
  proposal: ProposalEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
