import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'signed';
export type ConnectionRole = 'farmer' | 'trader';

@Entity('connections')
@Check('"from_user_id" <> "to_user_id"')
@Check(`"status" IN ('pending', 'accepted', 'rejected', 'negotiating', 'signed')`)
@Check(`"from_role" IN ('farmer', 'trader')`)
@Check(`"to_role" IN ('farmer', 'trader')`)
export class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_connections_from_user_id')
  @Column({ name: 'from_user_id' })
  fromUserId: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_connections_to_user_id')
  @Column({ name: 'to_user_id' })
  toUserId: string;

  @Column({ name: 'from_role', type: 'varchar' })
  fromRole: ConnectionRole;

  @Column({ name: 'to_role', type: 'varchar' })
  toRole: ConnectionRole;

  /**
   * Cross-service FK → farms.id (farm-service).
   */
  @Index('idx_connections_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ name: 'from_user_name', type: 'varchar', nullable: true })
  fromUserName: string | null;

  @Column({ name: 'to_user_name', type: 'varchar', nullable: true })
  toUserName: string | null;

  @Column({ name: 'farm_name', type: 'varchar', nullable: true })
  farmName: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Index('idx_connections_status')
  @Column({ type: 'varchar', default: 'pending' })
  status: ConnectionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
