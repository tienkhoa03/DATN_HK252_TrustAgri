import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

@Entity('proposals')
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buying_request_id' })
  buyingRequestId: string;

  @Column({ name: 'trader_id' })
  traderId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column({ name: 'standard_code', nullable: true, type: 'varchar' })
  standardCode: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ProposalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
