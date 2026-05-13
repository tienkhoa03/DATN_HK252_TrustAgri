import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('news_articles')
export class NewsArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   */
  @Index('idx_news_articles_trader_id')
  @Column({ name: 'trader_id', type: 'uuid' })
  traderId: string;

  @Column({ type: 'varchar', length: 512 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 128 })
  category: string;

  @Column({ name: 'image_url', type: 'varchar', length: 2048, nullable: true })
  imageUrl?: string | null;

  @Index('idx_news_articles_published_at')
  @Column({ name: 'published_at', type: 'timestamptz' })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
