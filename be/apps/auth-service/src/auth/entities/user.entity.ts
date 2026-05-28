import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest' | 'admin';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'zalo_id', unique: true })
  zaloId: string;

  @Column({ type: 'simple-array', default: 'buyer' })
  roles: UserRole[];

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
    /** Danh sách mã loại nông sản trader thu mua (vd: ['dragon_fruit', 'pomelo']). */
    purchasedCropTypes?: string[];
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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  // Dùng cho đăng nhập bằng username/password (không bắt buộc có tài khoản Zalo)
  @Column({ name: 'username', unique: true, nullable: true })
  username: string | null;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string | null;
}
