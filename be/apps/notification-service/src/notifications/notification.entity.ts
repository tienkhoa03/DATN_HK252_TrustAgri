import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
@Check(`"type" IN ('alert', 'contract', 'connection', 'system')`)
@Check(`"severity" IS NULL OR "severity" IN ('info', 'warning', 'danger')`)
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_notifications_user_id')
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  type: 'alert' | 'contract' | 'connection' | 'system';

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  severity?: 'info' | 'warning' | 'danger';

  @Column({ name: 'link_to', type: 'varchar', length: 1024, nullable: true })
  linkTo?: string;

  @Index('idx_notifications_unread')
  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
