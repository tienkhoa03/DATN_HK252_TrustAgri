import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { UserRole } from './entities/user.entity';
import { timingSafeEqual, scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
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
  UserPublicSummaryDto,
} from '@trustagri/shared';
import { UserEntity } from './entities/user.entity';
import { ZaloService } from './zalo.service';
import { RedisService } from './redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly zaloService: ZaloService,
    private readonly redisService: RedisService,
  ) {}

  async login(
    zaloAccessToken: string,
    phoneNumber?: string,
    phoneToken?: string,
  ): Promise<AuthLoginResponseDto> {
    // 1. Xác thực token với Zalo API
    const zaloUser = await this.zaloService.getUserInfo(zaloAccessToken);

    // 1b. Số điện thoại: ưu tiên giá trị FE gửi sẵn (dev/staging); nếu không có thì
    // giải mã `phoneToken` (code từ getPhoneNumber) qua Zalo /me/info (production). Fail-soft.
    let resolvedPhone = phoneNumber?.trim() || null;
    if (!resolvedPhone && phoneToken) {
      resolvedPhone = await this.zaloService.getPhoneNumber(zaloAccessToken, phoneToken);
    }

    // Zalo chỉ trả `name`/`picture` khi user cấp quyền scope.userInfo — fallback an toàn
    // vì cột display_name là NOT NULL.
    const displayName = zaloUser.name?.trim() || 'Người dùng Zalo';
    const avatarUrl = zaloUser.picture?.data?.url ?? null;

    // 2. Tìm hoặc tạo mới user
    let user = await this.userRepo.findOne({
      where: { zaloId: zaloUser.id },
    });

    if (!user) {
      user = this.userRepo.create({
        zaloId: zaloUser.id,
        displayName,
        avatarUrl,
        roles: ['buyer'],
        phone: resolvedPhone,
        email: null,
        traderProfile: null,
        farmerProfile: null,
        buyerProfile: null,
      });
    } else {
      // Chỉ ghi đè khi Zalo thực sự trả dữ liệu — tránh xóa thông tin sẵn có bằng giá trị rỗng.
      if (zaloUser.name?.trim()) {
        user.displayName = zaloUser.name.trim();
      }
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      // Cập nhật phone nếu chưa có hoặc người dùng cấp quyền mới
      if (resolvedPhone && user.phone !== resolvedPhone) {
        user.phone = resolvedPhone;
      }
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.issueSessionForUser(user);
  }

  /**
   * Đăng nhập bằng username/password — chỉ hoạt động khi AUTH_PASSWORD_LOGIN_ENABLED=true.
   * User phải được seed sẵn với username + password_hash (dùng AuthService.hashPassword).
   */
  async passwordLogin(username: string, password: string): Promise<AuthLoginResponseDto> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.issueSessionForUser(user);
  }

  /** Tạo password_hash để seed user. Dùng Node.js crypto.scrypt — không cần bcrypt. */
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hashHex] = stored.split(':');
    if (!salt || !hashHex) return false;
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedHash = Buffer.from(hashHex, 'hex');
    if (hash.length !== storedHash.length) return false;
    return timingSafeEqual(hash, storedHash);
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

  /** Phát hành access/refresh JWT và lưu session Redis — dùng chung login(), devLogin(), và switchRole(). */
  private async issueSessionForUser(user: UserEntity, requestedRole?: UserRole): Promise<AuthLoginResponseDto> {
    const activeRole: UserRole = requestedRole && user.roles.includes(requestedRole)
      ? requestedRole
      : user.roles[0] ?? 'buyer';

    const payload: JwtPayload = { sub: user.userId, role: activeRole };
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
      JSON.stringify({ userId: user.userId, role: activeRole }),
      ttlSeconds,
    );

    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    return {
      accessToken,
      refreshToken,
      userId: user.userId,
      role: activeRole,
      roles: user.roles,
      expiresAt,
    };
  }

  async switchRole(userId: string, newRole: UserRole): Promise<AuthLoginResponseDto> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (!user.roles.includes(newRole)) {
      throw new ForbiddenException(`Role '${newRole}' không thuộc tài khoản này`);
    }
    return this.issueSessionForUser(user, newRole);
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

  async getUserPublicById(userId: string): Promise<UserPublicSummaryDto> {
    const user = await this.userRepo.findOne({
      where: { userId },
      select: ['userId', 'displayName', 'phone', 'avatarUrl'],
    });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return {
      userId: user.userId,
      displayName: user.displayName,
      phone: user.phone ?? null,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    };
  }

  async updateMe(userId: string, dto: UserProfileUpdateDto): Promise<UserProfileDto> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // displayName và phone được quản lý bởi Zalo SDK — không cho phép sửa trực tiếp
    if (dto.displayName !== undefined) {
      this.logger.warn(`updateMe userId=${userId}: displayName bị bỏ qua (quản lý bởi Zalo)`);
    }
    if (dto.phone !== undefined) {
      this.logger.warn(`updateMe userId=${userId}: phone bị bỏ qua (quản lý bởi Zalo)`);
    }

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
      role: user.roles[0] ?? 'buyer',
      roles: user.roles,
      displayName: user.displayName,
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      // trustScore is intentionally omitted here; fetch from GET /traders/:id/trust-score (live AVG)
      traderProfile: user.traderProfile
        ? { ...user.traderProfile, trustScore: null as unknown as number }
        : undefined,
      farmerProfile: user.farmerProfile ?? undefined,
      buyerProfile: user.buyerProfile ?? undefined,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : new Date().toISOString(),
    };
  }
}
