import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  ConnectionDto,
  CreateConnectionDto,
  ListResponse,
  UserProfileDto,
  type UserDenormSnapshot,
} from '@trustagri/shared';
import { ConnectionEntity } from './entities/connection.entity';
import { ConnectionPublisherService } from './services/connection-publisher.service';
import { AuthClientService } from '../clients/auth-client.service';
import { FarmClientService } from '../clients/farm-client.service';
import { settledValue } from '../clients/settled.util';
import { ConnectionQueryDto } from './dto/connection-query.dto';
import { SearchTraderQueryDto } from './dto/search-trader-query.dto';
import { SearchFarmerQueryDto } from './dto/search-farmer-query.dto';

interface RawUserRow {
  user_id: string;
  zalo_id: string;
  role: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  trader_profile: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  } | null;
  farmer_profile: {
    region: string;
    experienceYears: number;
  } | null;
  buyer_profile: { organizationName?: string } | null;
  created_at: string;
  last_login: string | null;
  // Computed live from trader_reviews aggregate (null when no reviews)
  avg_rating: string | null;
}

@Injectable()
export class ConnectionsService implements OnModuleInit {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepo: Repository<ConnectionEntity>,
    private readonly dataSource: DataSource,
    private readonly publisher: ConnectionPublisherService,
    private readonly authClient: AuthClientService,
    private readonly farmClient: FarmClientService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTraderReviewsTable();
  }

  // Đảm bảo bảng trader_reviews tồn tại trước khi searchTraders chạy raw SQL
  private async ensureTraderReviewsTable(): Promise<void> {
    try {
      const [row] = await this.dataSource.query<[{ exists: boolean }]>(
        `SELECT to_regclass('public.trader_reviews') IS NOT NULL AS exists`,
      );
      if (!row?.exists) {
        this.logger.warn('trader_reviews table không tồn tại — tạo bảng tạm thời cho dev/staging');
        await this.dataSource.query(`
          CREATE TABLE IF NOT EXISTS trader_reviews (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trader_id   TEXT NOT NULL,
            buyer_id    TEXT NOT NULL,
            order_id    UUID,
            rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment     TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at  TIMESTAMPTZ
          )
        `);
        this.logger.log('trader_reviews table đã được tạo');
      }
    } catch (err) {
      this.logger.error(`ensureTraderReviewsTable thất bại: ${(err as Error).message}`);
    }
  }

  // ─── Search ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/traders/search
   * Tìm thương lái theo region, cropType (best-effort), trustScore tối thiểu.
   */
  async searchTraders(
    query: SearchTraderQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    try {
      return await this.searchTradersInternal(query);
    } catch (err) {
      this.logger.error(
        `searchTraders thất bại: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new ServiceUnavailableException('Không thể tìm kiếm thương lái lúc này, vui lòng thử lại');
    }
  }

  private async searchTradersInternal(
    query: SearchTraderQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ["u.role = 'trader'"];
    const params: unknown[] = [];
    let idx = 1;

    if (query.region) {
      conditions.push(`u.trader_profile->>'region' = $${idx++}`);
      params.push(query.region);
    }

    if (query.trustScore !== undefined) {
      // Filter by live-computed average rating (JOIN aggregate), not stale JSONB trustScore
      conditions.push(`COALESCE(tr.avg_rating, 0) >= $${idx++}`);
      params.push(query.trustScore);
    }

    if (query.cropType) {
      // cropType is matched against products owned by the trader
      conditions.push(`EXISTS (
        SELECT 1 FROM products p
        WHERE p.trader_id = u.user_id
          AND p.crop_type = $${idx++}
          AND p.deleted_at IS NULL
      )`);
      params.push(query.cropType);
    }

    const whereClause = conditions.join(' AND ');
    // Subquery aggregates trust score live; left join so traders with 0 reviews still appear
    // Cast u.user_id (uuid type) to text to match trader_id (varchar) — PostgreSQL won't coerce implicitly
    const trustJoin = `LEFT JOIN (
      SELECT trader_id,
             AVG(rating)::numeric AS avg_rating,
             COUNT(*)             AS review_count
      FROM trader_reviews
      WHERE deleted_at IS NULL
      GROUP BY trader_id
    ) tr ON tr.trader_id = u.user_id::text`;

    const countParams = [...params];
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<RawUserRow[]>(
        `SELECT u.user_id, u.zalo_id, u.role, u.display_name, u.phone, u.email,
                u.avatar_url, u.trader_profile, u.farmer_profile, u.buyer_profile,
                u.created_at, u.last_login,
                tr.avg_rating
         FROM users u
         ${trustJoin}
         WHERE ${whereClause}
         ORDER BY tr.avg_rating DESC NULLS LAST
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM users u ${trustJoin} WHERE ${whereClause}`,
        countParams,
      ),
    ]);

    return {
      items: rows.map((r) => this.rowToUserProfileDto(r)),
      page,
      limit,
      total: parseInt(countRows[0]?.count ?? '0', 10),
    };
  }

  /**
   * GET /api/v1/farmers/search
   * Tìm nông dân theo region, cropType (join với farms).
   */
  async searchFarmers(
    query: SearchFarmerQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ["u.role = 'farmer'"];
    const params: unknown[] = [];
    let idx = 1;

    if (query.region) {
      conditions.push(`u.farmer_profile->>'region' = $${idx++}`);
      params.push(query.region);
    }

    let joinClause = '';
    if (query.cropType) {
      joinClause = `JOIN farms f ON f.owner_id = u.user_id AND f.deleted_at IS NULL`;
      conditions.push(`f.crop_type = $${idx++}`);
      params.push(query.cropType);
    }

    const whereClause = conditions.join(' AND ');

    const countParams = [...params];
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<RawUserRow[]>(
        `SELECT DISTINCT u.user_id, u.zalo_id, u.role, u.display_name, u.phone, u.email,
                u.avatar_url, u.trader_profile, u.farmer_profile, u.buyer_profile,
                u.created_at, u.last_login
         FROM users u ${joinClause}
         WHERE ${whereClause}
         ORDER BY u.display_name ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(DISTINCT u.user_id) as count FROM users u ${joinClause} WHERE ${whereClause}`,
        countParams,
      ),
    ]);

    return {
      items: rows.map((r) => this.rowToUserProfileDto(r)),
      page,
      limit,
      total: parseInt(countRows[0]?.count ?? '0', 10),
    };
  }

  // ─── Connections CRUD ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/connections
   * Lấy danh sách kết nối của người dùng hiện tại.
   */
  async listConnections(
    userId: string,
    query: ConnectionQueryDto,
  ): Promise<ListResponse<ConnectionDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<ConnectionEntity> = {};

    if (query.role === 'incoming') {
      where.toUserId = userId;
    } else if (query.role === 'outgoing') {
      where.fromUserId = userId;
    } else {
      // Trả về cả hai chiều — dùng query builder
      return this.listConnectionsBothDirections(userId, query);
    }

    if (query.status) {
      where.status = query.status;
    }

    const [rows, total] = await this.connectionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  private async listConnectionsBothDirections(
    userId: string,
    query: ConnectionQueryDto,
  ): Promise<ListResponse<ConnectionDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.connectionRepo
      .createQueryBuilder('c')
      .where('(c.fromUserId = :userId OR c.toUserId = :userId)', { userId })
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  /**
   * POST /api/v1/connections
   * Gửi yêu cầu kết nối.
   */
  async createConnection(
    dto: CreateConnectionDto,
    userId: string,
    userRole: 'farmer' | 'trader',
  ): Promise<ConnectionDto> {
    if (userId === dto.toUserId) {
      throw new BadRequestException('Không thể gửi yêu cầu kết nối cho chính mình');
    }

    // Kiểm tra người nhận tồn tại và có vai trò hợp lệ
    const toUserRows = await this.dataSource.query<{ user_id: string; role: string }[]>(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [dto.toUserId],
    );
    if (!toUserRows?.length) {
      throw new NotFoundException('Người dùng đích không tồn tại');
    }
    const toRole = toUserRows[0].role as 'farmer' | 'trader';

    if (toRole !== 'farmer' && toRole !== 'trader') {
      throw new BadRequestException(
        'Chỉ có thể kết nối với nông dân hoặc thương lái',
      );
    }

    // Trùng chỉ khi cùng from + to + farm (một thương lái có thể kết nối nhiều vườn của cùng nông dân)
    const farmId = dto.farmId ?? null;
    const duplicateQb = this.connectionRepo
      .createQueryBuilder('c')
      .where('c.fromUserId = :from', { from: userId })
      .andWhere('c.toUserId = :to', { to: dto.toUserId })
      .andWhere('c.status IN (:...statuses)', {
        statuses: ['pending', 'accepted'],
      });

    if (farmId === null) {
      duplicateQb.andWhere('c.farmId IS NULL');
    } else {
      duplicateQb.andWhere('c.farmId = :farmId', { farmId });
    }

    const existing = await duplicateQb.getOne();

    if (existing) {
      throw new ConflictException(
        farmId
          ? 'Đã có yêu cầu kết nối hoặc đang kết nối với vườn này'
          : 'Đã có yêu cầu kết nối hoặc đang kết nối với người dùng này (không gắn vườn)',
      );
    }

    const denorm = await this.resolveConnectionDenorm(
      userId,
      dto.toUserId,
      dto.farmId ?? null,
    );

    const entity = this.connectionRepo.create({
      fromUserId: userId,
      toUserId: dto.toUserId,
      fromRole: userRole,
      toRole,
      farmId: dto.farmId ?? null,
      fromUserName: denorm.fromUserName,
      fromUserPhone: denorm.fromUserPhone,
      toUserName: denorm.toUserName,
      toUserPhone: denorm.toUserPhone,
      farmName: denorm.farmName,
      message: dto.message ?? null,
      status: 'pending',
    });

    const saved = await this.connectionRepo.save(entity);
    const connectionDto = this.toDto(saved);

    await this.publisher.publishConnectionRequested(connectionDto);
    this.logger.log(
      `Connection requested: id=${saved.id} from=${userId} to=${dto.toUserId}`,
    );

    return connectionDto;
  }

  /**
   * POST /api/v1/connections/:id/accept
   * Chấp nhận yêu cầu kết nối (chỉ người nhận).
   */
  async acceptConnection(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDto> {
    const connection = await this.requireConnection(connectionId);
    this.ensureRecipient(connection, userId);
    this.ensurePending(connection);

    connection.status = 'accepted';
    connection.respondedAt = new Date();
    const saved = await this.connectionRepo.save(connection);
    const dto = this.toDto(saved);

    await this.publisher.publishConnectionUpdated(dto);
    return dto;
  }

  /**
   * POST /api/v1/connections/:id/reject
   * Từ chối yêu cầu kết nối (chỉ người nhận).
   */
  async rejectConnection(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDto> {
    const connection = await this.requireConnection(connectionId);
    this.ensureRecipient(connection, userId);
    this.ensurePending(connection);

    connection.status = 'rejected';
    connection.respondedAt = new Date();
    const saved = await this.connectionRepo.save(connection);
    const dto = this.toDto(saved);

    await this.publisher.publishConnectionUpdated(dto);
    return dto;
  }

  /**
   * Tự động đặt kết nối farmer↔trader thành 'signed' khi hợp đồng farmer_trader trở thành active.
   * Không throw nếu không tìm thấy kết nối — chỉ log cảnh báo.
   */
  async markConnectionSignedByContract(
    farmerId: string,
    traderId: string,
    farmId: string | null,
  ): Promise<void> {
    // Tìm kết nối chưa ký giữa farmer và trader theo cả hai chiều
    const qb = this.connectionRepo
      .createQueryBuilder('c')
      .where(
        '((c.fromUserId = :farmerId AND c.toUserId = :traderId) OR (c.fromUserId = :traderId AND c.toUserId = :farmerId))',
        { farmerId, traderId },
      )
      .andWhere('c.status IN (:...statuses)', {
        statuses: ['accepted'],
      })
      .andWhere('c.deletedAt IS NULL');

    const candidates = await qb.getMany();

    if (candidates.length === 0) {
      this.logger.warn(
        `markConnectionSignedByContract: không tìm thấy kết nối accepted giữa farmer=${farmerId} trader=${traderId}`,
      );
      return;
    }

    // Ưu tiên kết nối khớp farmId nếu có; nếu không, lấy kết nối đầu tiên
    const connection =
      (farmId !== null && candidates.find((c) => c.farmId === farmId)) ||
      candidates[0];

    this.logger.log(
      `Contract signed, connection remains accepted: id=${connection.id} farmer=${farmerId} trader=${traderId}`,
    );
  }

  /**
   * DELETE /api/v1/connections/:id
   * Hủy kết nối (pending hoặc accepted) — cả hai phía đều được phép.
   */
  async deleteConnection(
    connectionId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const connection = await this.requireConnection(connectionId);
    if (connection.fromUserId !== userId && connection.toUserId !== userId) {
      throw new ForbiddenException('Chỉ người trong kết nối mới có thể hủy');
    }
    if (connection.status !== 'pending' && connection.status !== 'accepted') {
      throw new ConflictException(
        `Không thể hủy kết nối ở trạng thái "${connection.status}"`,
      );
    }
    connection.status = 'cancelled';
    const saved = await this.connectionRepo.save(connection);
    const dto = this.toDto(saved);
    await this.publisher.publishConnectionUpdated(dto);
    this.logger.log(`Connection cancelled: id=${connectionId} by=${userId}`);
    return { success: true };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async requireConnection(id: string): Promise<ConnectionEntity> {
    const connection = await this.connectionRepo.findOne({ where: { id } });
    if (!connection) {
      throw new NotFoundException('Yêu cầu kết nối không tồn tại');
    }
    return connection;
  }

  private ensureRecipient(connection: ConnectionEntity, userId: string): void {
    if (connection.toUserId !== userId) {
      throw new ForbiddenException(
        'Chỉ người nhận mới có thể chấp nhận hoặc từ chối yêu cầu kết nối',
      );
    }
  }

  /** Gọi Auth Service lấy displayName + phone; Farm Service lấy farmName — ghi vào INSERT. */
  private async resolveConnectionDenorm(
    fromUserId: string,
    toUserId: string,
    farmId: string | null,
  ): Promise<{
    fromUserName: string | null;
    fromUserPhone: string | null;
    toUserName: string | null;
    toUserPhone: string | null;
    farmName: string | null;
  }> {
    const [fromSnapRes, toSnapRes, farmNameRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(fromUserId),
      this.authClient.getUserSnapshot(toUserId),
      farmId ? this.farmClient.getFarmName(farmId) : Promise.resolve(null),
    ]);

    const fromSnap = settledValue(fromSnapRes);
    const toSnap = settledValue(toSnapRes);

    this.logConnectionDenormMiss('fromUser', fromUserId, fromSnap);
    this.logConnectionDenormMiss('toUser', toUserId, toSnap);

    return {
      fromUserName: fromSnap?.displayName ?? null,
      fromUserPhone: fromSnap?.phone ?? null,
      toUserName: toSnap?.displayName ?? null,
      toUserPhone: toSnap?.phone ?? null,
      farmName: settledValue(farmNameRes),
    };
  }

  private logConnectionDenormMiss(
    label: string,
    userId: string,
    snap: UserDenormSnapshot | null,
  ): void {
    if (snap?.displayName) return;
    this.logger.warn(
      `Auth không trả displayName cho ${label} userId=${userId} — kiểm tra AUTH_SERVICE_URL và GET /auth/users/:id`,
    );
  }

  private ensurePending(connection: ConnectionEntity): void {
    if (connection.status !== 'pending') {
      throw new ConflictException(
        `Yêu cầu kết nối đã ở trạng thái "${connection.status}", không thể thay đổi`,
      );
    }
  }

  private toDto(entity: ConnectionEntity): ConnectionDto {
    return {
      id: entity.id,
      fromUserId: entity.fromUserId,
      toUserId: entity.toUserId,
      fromUserName: entity.fromUserName ?? null,
      fromUserPhone: entity.fromUserPhone ?? null,
      toUserName: entity.toUserName ?? null,
      toUserPhone: entity.toUserPhone ?? null,
      fromRole: entity.fromRole,
      toRole: entity.toRole,
      farmId: entity.farmId ?? undefined,
      farmName: entity.farmName ?? null,
      message: entity.message ?? undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      respondedAt: entity.respondedAt?.toISOString() ?? undefined,
    };
  }

  private rowToUserProfileDto(row: RawUserRow): UserProfileDto {
    const traderProfile = row.trader_profile
      ? {
          ...row.trader_profile,
          // Source: live AVG from trader_reviews; null when no reviews yet
          trustScore: row.avg_rating !== null && row.avg_rating !== undefined
            ? parseFloat(Number(row.avg_rating).toFixed(1))
            : 0,
        }
      : undefined;

    return {
      userId: row.user_id,
      zaloId: row.zalo_id,
      role: row.role as UserProfileDto['role'],
      displayName: row.display_name,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      traderProfile,
      farmerProfile: row.farmer_profile ?? undefined,
      buyerProfile: row.buyer_profile ?? undefined,
      createdAt: row.created_at,
      lastLogin: row.last_login ?? '',
    };
  }
}
