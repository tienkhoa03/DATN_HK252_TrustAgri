import {
  IsArray,
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsIn,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest' | 'admin';

/**
 * Phản hồi đăng nhập (design.md §4.1)
 */
export interface AuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: UserRole;
  roles: UserRole[];
  expiresAt: string;
}

/**
 * Phản hồi verify token (design.md §4.1)
 */
export interface AuthVerifyResponseDto {
  userId: string;
  role: UserRole;
  valid: true;
}

/**
 * Hồ sơ người dùng đầy đủ (design.md §4.1)
 */
export interface UserProfileDto {
  userId: string;
  zaloId: string;
  role: UserRole;
  roles: UserRole[];
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  traderProfile?: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
    /** Danh sách mã loại nông sản trader thu mua. */
    purchasedCropTypes?: string[];
  };
  farmerProfile?: {
    region: string;
    experienceYears: number;
  };
  buyerProfile?: {
    organizationName?: string;
  };
  createdAt: string;
  lastLogin: string;
}

/**
 * GET /api/v1/auth/users/:userId — tóm tắt hiển thị (không có email/zaloId).
 * phone dùng cho denorm trên UI đối tác đã kết nối / hợp đồng.
 */
export interface UserPublicSummaryDto {
  userId: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string;
}

/** Snapshot denorm khi ghi DB (tên + SĐT). */
export interface UserDenormSnapshot {
  displayName: string | null;
  phone: string | null;
}

/**
 * Request body cho POST /api/v1/auth/login
 */
export class AuthLoginDto {
  @ApiProperty({ description: 'Zalo OAuth access token from ZMP SDK', example: 'zalo_access_token_abc123' })
  @IsString()
  zaloAccessToken: string;

  /** Số điện thoại từ ZMP SDK (best-effort, FE gửi kèm nếu user đã cấp quyền) */
  @ApiPropertyOptional({ description: 'Phone number from Zalo SDK (sent if user granted permission)', example: '0901234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/**
 * POST /api/v1/auth/password-login — chỉ bật khi AUTH_PASSWORD_LOGIN_ENABLED=true.
 * User phải đã được seed với username + password_hash trong DB.
 */
export class AuthPasswordLoginDto {
  @ApiProperty({ description: 'Username (seeded in DB)', example: 'farmer_001' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password (seeded in DB)', example: 'secret123' })
  @IsString()
  password: string;
}

/**
 * POST /api/v1/auth/dev-login — chỉ bật khi AUTH_DEV_LOGIN_ENABLED=true (không dùng production).
 * Body: secret + zaloId (user phải đã tồn tại trong DB, ví dụ sau seed-dev-users.sql).
 */
export class AuthDevLoginDto {
  @ApiProperty({ description: 'Dev login secret (matches DEV_LOGIN_SECRET env var)', example: 'dev-secret-16chars' })
  @IsString()
  secret: string;

  /** Ví dụ: zalo_dev_farmer_001 — khớp cột users.zalo_id */
  @ApiProperty({ description: 'Zalo ID of an existing seeded dev user', example: 'zalo_dev_farmer_001' })
  @IsString()
  zaloId: string;
}

/** Nested DTO cho traderProfile */
export class TraderProfileUpdateDto {
  @ApiProperty({ description: 'Trader company name', example: 'Cong Ty TNHH Nong San Xanh' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Operating region', example: 'Mekong Delta' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Trade capacity description', example: '50 tons/month' })
  @IsString()
  capacity: string;

  @ApiProperty({ description: 'Trust score (0-100)', example: 85, minimum: 0 })
  @IsNumber()
  @Min(0)
  trustScore: number;

  @ApiPropertyOptional({
    description: 'Danh sách mã loại nông sản trader thu mua',
    example: ['dragon_fruit', 'pomelo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  purchasedCropTypes?: string[];
}

/** Nested DTO cho farmerProfile */
export class FarmerProfileUpdateDto {
  @ApiProperty({ description: 'Farmer region', example: 'An Giang' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Years of farming experience', example: 10, minimum: 0 })
  @IsNumber()
  @Min(0)
  experienceYears: number;
}

/** Nested DTO cho buyerProfile */
export class BuyerProfileUpdateDto {
  @ApiPropertyOptional({ description: 'Buyer organization name', example: 'Sieu Thi BigC' })
  @IsOptional()
  @IsString()
  organizationName?: string;
}

/**
 * Request body cho PUT /api/v1/auth/me (design.md §4.1)
 */
export class UserProfileUpdateDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Nguyen Van An' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'farmer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL', example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Trader profile details', type: () => TraderProfileUpdateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TraderProfileUpdateDto)
  traderProfile?: TraderProfileUpdateDto;

  @ApiPropertyOptional({ description: 'Farmer profile details', type: () => FarmerProfileUpdateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FarmerProfileUpdateDto)
  farmerProfile?: FarmerProfileUpdateDto;

  @ApiPropertyOptional({ description: 'Buyer profile details', type: () => BuyerProfileUpdateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BuyerProfileUpdateDto)
  buyerProfile?: BuyerProfileUpdateDto;
}

/**
 * POST /api/v1/auth/switch-role — chuyển active role, phát JWT mới.
 */
export class AuthSwitchRoleDto {
  @ApiProperty({ description: 'Role to switch to', enum: ['farmer', 'trader', 'buyer', 'guest', 'admin'] })
  @IsIn(['farmer', 'trader', 'buyer', 'guest', 'admin'])
  role: UserRole;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
