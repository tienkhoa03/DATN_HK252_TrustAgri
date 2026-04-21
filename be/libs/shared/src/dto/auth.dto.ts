import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsIn,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest' | 'admin';

/**
 * Phản hồi đăng nhập (design.md §4.1)
 */
export interface AuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: UserRole;
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
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  traderProfile?: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
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
 * Request body cho POST /api/v1/auth/login
 */
export class AuthLoginDto {
  @IsString()
  zaloAccessToken: string;
}

/**
 * POST /api/v1/auth/dev-login — chỉ bật khi AUTH_DEV_LOGIN_ENABLED=true (không dùng production).
 * Body: secret + zaloId (user phải đã tồn tại trong DB, ví dụ sau seed-dev-users.sql).
 */
export class AuthDevLoginDto {
  @IsString()
  secret: string;

  /** Ví dụ: zalo_dev_farmer_001 — khớp cột users.zalo_id */
  @IsString()
  zaloId: string;
}

/** Nested DTO cho traderProfile */
export class TraderProfileUpdateDto {
  @IsString()
  companyName: string;

  @IsString()
  region: string;

  @IsString()
  capacity: string;

  @IsNumber()
  @Min(0)
  trustScore: number;
}

/** Nested DTO cho farmerProfile */
export class FarmerProfileUpdateDto {
  @IsString()
  region: string;

  @IsNumber()
  @Min(0)
  experienceYears: number;
}

/** Nested DTO cho buyerProfile */
export class BuyerProfileUpdateDto {
  @IsOptional()
  @IsString()
  organizationName?: string;
}

/**
 * Request body cho PUT /api/v1/auth/me (design.md §4.1)
 */
export class UserProfileUpdateDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TraderProfileUpdateDto)
  traderProfile?: TraderProfileUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FarmerProfileUpdateDto)
  farmerProfile?: FarmerProfileUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BuyerProfileUpdateDto)
  buyerProfile?: BuyerProfileUpdateDto;
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
