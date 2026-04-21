import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ContractStatus = 'active' | 'pending_change' | 'completed' | 'cancelled';
export type ContractType = 'farmer_trader' | 'trader_buyer';

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'party_farmer_id', nullable: true, type: 'varchar' })
  partyFarmerId: string | null;

  @Column({ name: 'party_trader_id' })
  partyTraderId: string;

  @Column({ name: 'party_buyer_id', nullable: true, type: 'varchar' })
  partyBuyerId: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 20 })
  contractType: ContractType;

  @Column({ name: 'product_id', nullable: true, type: 'varchar' })
  productId: string | null;

  @Column({ name: 'standard_id', nullable: true, type: 'varchar' })
  standardId: string | null;

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

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ContractStatus;

  @Column({ type: 'text', default: '' })
  terms: string;

  /** Tham chiếu đơn hàng tạo ra hợp đồng này (nếu có) */
  @Column({ name: 'order_id', nullable: true, type: 'varchar' })
  orderId: string | null;

  /** Tham chiếu đề xuất tạo ra hợp đồng này (nếu có) */
  @Column({ name: 'proposal_id', nullable: true, type: 'varchar' })
  proposalId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
