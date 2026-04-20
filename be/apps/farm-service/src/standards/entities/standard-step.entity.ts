import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StandardEntity } from './standard.entity';

@Entity('standard_steps')
export class StandardStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'standard_id' })
  standardId: string;

  @ManyToOne(() => StandardEntity, (std) => std.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_id' })
  standard: StandardEntity;

  @Column({ type: 'int' })
  order: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'expected_duration_days', type: 'int', nullable: true })
  expectedDurationDays: number | null;

  @Column({ name: 'acceptance_criteria', type: 'text', nullable: true })
  acceptanceCriteria: string | null;
}
