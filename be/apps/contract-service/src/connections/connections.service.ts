import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  ConnectionDto,
  CreateConnectionDto,
  ListResponse,
  UserProfileDto,
} from '@trustagri/shared';
import { ConnectionEntity } from './entities/connection.entity';
import { ConnectionPublisherService } from './services/connection-publisher.service';
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
}

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepo: Repository<ConnectionEntity>,
    private readonly dataSource: DataSource,
    private readonly publisher: ConnectionPublisherService,
  ) {}

  // ─── Search ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/traders/search
   * Tìm thương lái theo region, cropType (best-effort), trustScore tối thiểu.
   */
  async searchTraders(
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
      conditions.push(
        `(u.trader_profile->>'trustScore')::numeric >= $${idx++}`,
      );
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

    const countParams = [...params];
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<RawUserRow[]>(
        `SELECT u.user_id, u.zalo_id, u.role, u.display_name, u.phone, u.email,
                u.avatar_url, u.trader_profile, u.farmer_profile, u.buyer_profile,
                u.created_at, u.last_login
         FROM users u
         WHERE ${whereClause}
         ORDER BY (u.trader_profile->>'trustScore')::numeric DESC NULLS LAST
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM users u WHERE ${whereClause}`,
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
    const [toUserRows] = await this.dataSource.query<RawUserRow[]>(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [dto.toUserId],
    );
    if (!toUserRows) {
      throw new NotFoundException('Người dùng đích không tồn tại');
    }
    const toRole = toUserRows.role as 'farmer' | 'trader';

    if (toRole !== 'farmer' && toRole !== 'trader') {
      throw new BadRequestException(
        'Chỉ có thể kết nối với nông dân hoặc thương lái',
      );
    }

    // Kiểm tra duplicate: đã có kết nối pending/accepted giữa hai người này chưa
    const existing = await this.connectionRepo
      .createQueryBuilder('c')
      .where(
        '((c.fromUserId = :from AND c.toUserId = :to) OR (c.fromUserId = :to AND c.toUserId = :from))',
        { from: userId, to: dto.toUserId },
      )
      .andWhere('c.status IN (:...statuses)', {
        statuses: ['pending', 'accepted'],
      })
      .getOne();

    if (existing) {
      throw new ConflictException(
        'Đã có yêu cầu kết nối hoặc đang được kết nối với người dùng này',
      );
    }

    const entity = this.connectionRepo.create({
      fromUserId: userId,
      toUserId: dto.toUserId,
      fromRole: userRole,
      toRole,
      farmId: dto.farmId ?? null,
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
      fromRole: entity.fromRole,
      toRole: entity.toRole,
      farmId: entity.farmId ?? undefined,
      message: entity.message ?? undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      respondedAt: entity.respondedAt?.toISOString() ?? undefined,
    };
  }

  private rowToUserProfileDto(row: RawUserRow): UserProfileDto {
    return {
      userId: row.user_id,
      zaloId: row.zalo_id,
      role: row.role as UserProfileDto['role'],
      displayName: row.display_name,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      traderProfile: row.trader_profile ?? undefined,
      farmerProfile: row.farmer_profile ?? undefined,
      buyerProfile: row.buyer_profile ?? undefined,
      createdAt: row.created_at,
      lastLogin: row.last_login ?? '',
    };
  }
}
