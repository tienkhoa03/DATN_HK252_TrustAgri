import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StandardStepEntity } from './standard-step.entity';

@Entity('standards')
export class StandardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  /**
   * Cross-service FK → users.user_id (auth-service).
   * DB-level FK is enforced via manual SQL; TypeORM cannot define
   * @ManyToOne here because UserEntity lives in a separate service.
   */
  @Index('idx_standards_owner_trader_id')
  @Column({ name: 'owner_trader_id', nullable: true, type: 'varchar' })
  ownerTraderId: string | null;

  @OneToMany(() => StandardStepEntity, (step) => step.standard, {
    cascade: true,
    eager: false,
  })
  steps: StandardStepEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
