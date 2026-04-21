import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthLoginResponseDto,
  AuthVerifyResponseDto,
  JwtPayload,
  UserProfileDto,
  UserProfileUpdateDto,
} from '@trustagri/shared';
import { UserEntity } from './entities/user.entity';
import { ZaloService } from './zalo.service';
import { RedisService } from './redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly zaloService: ZaloService,
    private readonly redisService: RedisService,
  ) {}

  async login(zaloAccessToken: string): Promise<AuthLoginResponseDto> {
    // 1. Xác thực token với Zalo API
    const zaloUser = await this.zaloService.getUserInfo(zaloAccessToken);

    // 2. Tìm hoặc tạo mới user
    let user = await this.userRepo.findOne({
      where: { zaloId: zaloUser.id },
    });

    if (!user) {
      user = this.userRepo.create({
        zaloId: zaloUser.id,
        displayName: zaloUser.name,
        avatarUrl: zaloUser.picture?.data?.url ?? null,
        role: 'guest',
        phone: null,
        email: null,
        traderProfile: null,
        farmerProfile: null,
        buyerProfile: null,
      });
    } else {
      user.displayName = zaloUser.name;
      if (zaloUser.picture?.data?.url) {
        user.avatarUrl = zaloUser.picture.data.url;
      }
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.issueSessionForUser(user);
  }

  /**
   * Dev-only: JWT thật + session Redis giống login(), lookup user theo zalo_id (seed).
   * Bảo vệ: cờ env, localhost guard, rate limit, DEV_LOGIN_SECRET (không commit giá trị thật).
   */
  async devLogin(clientIp: string, secret: string, zaloId: string): Promise<AuthLoginResponseDto> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev login không khả dụng');
    }
    if (this.configService.get<string>('AUTH_DEV_LOGIN_ENABLED') !== 'true') {
      throw new ForbiddenException('Dev login không được bật');
    }

    const expectedSecret = this.configService.get<string>('DEV_LOGIN_SECRET', '');
    if (!expectedSecret || expectedSecret.length < 16) {
      throw new ServiceUnavailableException(
        'DEV_LOGIN_SECRET chưa cấu hình (tối thiểu 16 ký tự) khi AUTH_DEV_LOGIN_ENABLED=true',
      );
    }
    if (!this.timingSafeEqualUtf8(secret, expectedSecret)) {
      throw new UnauthorizedException('Secret không hợp lệ');
    }

    const windowSec = 60;
    const maxPerWindow = parseInt(
      this.configService.get<string>('DEV_LOGIN_RATE_LIMIT_PER_MIN', '10'),
      10,
    );
    const n = await this.redisService.incrWithTtl(`ratelimit:dev-login:${clientIp}`, windowSec);
    if (n > maxPerWindow) {
      throw new HttpException(
        'Quá nhiều yêu cầu dev-login, thử lại sau',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepo.findOne({ where: { zaloId } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với zaloId=${zaloId} (đã chạy seed-dev-users.sql?)`);
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.issueSessionForUser(user);
  }

  private timingSafeEqualUtf8(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }

  /** Phát hành access/refresh JWT và lưu session Redis — dùng chung login() và devLogin(). */
  private async issueSessionForUser(user: UserEntity): Promise<AuthLoginResponseDto> {
    const payload: JwtPayload = { sub: user.userId, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn,
    });

    const decoded = this.jwtService.decode(accessToken) as {
      exp: number;
      iat: number;
    };
    const ttlSeconds = decoded.exp - decoded.iat;
    await this.redisService.set(
      `session:${accessToken}`,
      JSON.stringify({ userId: user.userId, role: user.role }),
      ttlSeconds,
    );

    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    return {
      accessToken,
      refreshToken,
      userId: user.userId,
      role: user.role,
      expiresAt,
    };
  }

  async verify(token: string): Promise<AuthVerifyResponseDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra session trong Redis
    const session = await this.redisService.get(`session:${token}`);
    if (!session) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc đã đăng xuất');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      valid: true,
    };
  }

  async logout(token: string): Promise<{ success: true }> {
    if (token) {
      await this.redisService.del(`session:${token}`);
    }
    return { success: true };
  }

  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return this.mapToProfileDto(user);
  }

  async updateMe(userId: string, dto: UserProfileUpdateDto): Promise<UserProfileDto> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.traderProfile !== undefined) user.traderProfile = dto.traderProfile;
    if (dto.farmerProfile !== undefined) user.farmerProfile = dto.farmerProfile;
    if (dto.buyerProfile !== undefined) user.buyerProfile = dto.buyerProfile;

    await this.userRepo.save(user);
    return this.mapToProfileDto(user);
  }

  private mapToProfileDto(user: UserEntity): UserProfileDto {
    return {
      userId: user.userId,
      zaloId: user.zaloId,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      traderProfile: user.traderProfile ?? undefined,
      farmerProfile: user.farmerProfile ?? undefined,
      buyerProfile: user.buyerProfile ?? undefined,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : new Date().toISOString(),
    };
  }
}
