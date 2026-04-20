import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'zalo_id', unique: true })
  zaloId: string;

  @Column({
    type: 'enum',
    enum: ['farmer', 'trader', 'buyer', 'guest'],
    default: 'guest',
  })
  role: UserRole;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ nullable: true, name: 'phone' })
  phone: string | null;

  @Column({ nullable: true, name: 'email' })
  email: string | null;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'trader_profile' })
  traderProfile: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true, name: 'farmer_profile' })
  farmerProfile: {
    region: string;
    experienceYears: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true, name: 'buyer_profile' })
  buyerProfile: {
    organizationName?: string;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;
}
