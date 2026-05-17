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
} from 'typeorm';
import { BuyingRequestEntity } from '../../buying-requests/entities/buying-request.entity';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

@Entity('proposals')
@Check('"price" > 0')
@Check('"quantity" > 0')
@Check(`"status" IN ('pending', 'accepted', 'rejected')`)
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_proposals_buying_request_id')
  @Column({ name: 'buying_request_id' })
  buyingRequestId: string;

  @ManyToOne(() => BuyingRequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buying_request_id' })
  buyingRequest: BuyingRequestEntity;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_proposals_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  /** Cross-service FK → farms.id — vườn cung cấp theo hợp đồng đã ký */
  @Index('idx_proposals_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ name: 'trader_display_name', type: 'varchar', nullable: true })
  traderDisplayName: string | null;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column({ name: 'standard_code', nullable: true, type: 'varchar' })
  standardCode: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Index('idx_proposals_status')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ProposalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
