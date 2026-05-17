import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Redis from 'ioredis';
import {
  CareLogDto,
  DashboardBuyerDto,
  DashboardFarmerDto,
  DashboardTraderDto,
  FarmDto,
  JwtPayload,
  ListResponse,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { OrderEntity } from '../orders/entities/order.entity';
import { BuyingRequestEntity } from '../buying-requests/entities/buying-request.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ConnectionEntity } from '../connections/entities/connection.entity';
import { ProposalEntity } from '../proposals/entities/proposal.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { ComplianceService } from '../contracts/compliance.service';

const DASHBOARD_TTL_SEC = 120;
const CACHE_PREFIX = {
  trader: 'dashboard:trader:',
  farmer: 'dashboard:farmer:',
  buyer: 'dashboard:buyer:',
} as const;

@Injectable()
export class DashboardService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DashboardService.name);
  private redis: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly complianceService: ComplianceService,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(BuyingRequestEntity)
    private readonly buyingRequestRepo: Repository<BuyingRequestEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepo: Repository<ConnectionEntity>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepo: Repository<ProposalEntity>,
  ) {}

  onModuleInit(): void {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    this.redis.on('error', (err: Error) =>
      this.logger.warn(`Redis (dashboard cache): ${err.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }

  async getTraderDashboard(user: JwtPayload): Promise<DashboardTraderDto> {
    const key = `${CACHE_PREFIX.trader}${user.sub}`;
    const cached = await this.getCached<DashboardTraderDto>(key);
    if (cached) return cached;

    const { from, to, periodFrom, periodTo } = this.defaultPeriod();

    const orderRows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('o.traderId = :uid', { uid: user.sub })
      .andWhere('o.createdAt >= :from', { from })
      .andWhere('o.createdAt <= :to', { to })
      .groupBy('o.status')
      .getRawMany<{ status: string; cnt: string }>();

    const orderCountByStatus: Record<string, number> = {};
    for (const row of orderRows) {
      orderCountByStatus[row.status] = parseInt(row.cnt, 10);
    }

    const trendRows = await this.buyingRequestRepo
      .createQueryBuilder('br')
      .select('DATE(br.createdAt)', 'date')
      .addSelect('COUNT(*)', 'requestCount')
      .where('br.createdAt >= :from', { from })
      .andWhere('br.createdAt <= :to', { to })
      .groupBy('DATE(br.createdAt)')
      .orderBy('DATE(br.createdAt)', 'ASC')
      .getRawMany<{ date: string; requestCount: string }>();

    const demandTrend = trendRows.map((r) => ({
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : String(r.date),
      requestCount: parseInt(r.requestCount, 10),
    }));

    const cropRows = await this.orderRepo
      .createQueryBuilder('o')
      .innerJoin(
        ProductEntity,
        'p',
        'p.id = o.productId AND p.deletedAt IS NULL',
      )
      .select('p.cropType', 'cropType')
      .addSelect('SUM(o.quantity)', 'volume')
      .where('o.traderId = :uid', { uid: user.sub })
      .andWhere('o.createdAt >= :from', { from })
      .andWhere('o.createdAt <= :to', { to })
      .groupBy('p.cropType')
      .orderBy('SUM(o.quantity)', 'DESC')
      .limit(10)
      .getRawMany<{ cropType: string; volume: string }>();

    const topCrops = cropRows.map((r) => ({
      cropType: r.cropType,
      volume: Number(r.volume),
    }));

    const activeContracts = await this.contractRepo.count({
      where: {
        partyTraderId: user.sub,
        status: In(['active', 'pending_change']),
      },
    });

    const pendingConnections = await this.connectionRepo.count({
      where: [
        { status: 'pending', fromUserId: user.sub },
        { status: 'pending', toUserId: user.sub },
      ],
    });

    const dto: DashboardTraderDto = {
      periodFrom,
      periodTo,
      orderCountByStatus,
      demandTrend,
      topCrops,
      activeContracts,
      pendingConnections,
    };

    await this.setCached(key, dto);
    return dto;
  }

  async getFarmerDashboard(
    user: JwtPayload,
    authorization?: string,
  ): Promise<DashboardFarmerDto> {
    try {
      return await this.getFarmerDashboardInternal(user, authorization);
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      this.logger.error(
        `getFarmerDashboard thất bại userId=${user.sub}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new ServiceUnavailableException(
        'Không thể tải dashboard lúc này, vui lòng thử lại',
      );
    }
  }

  private async getFarmerDashboardInternal(
    user: JwtPayload,
    authorization?: string,
  ): Promise<DashboardFarmerDto> {
    const key = `${CACHE_PREFIX.farmer}${user.sub}`;
    const cached = await this.getCached<DashboardFarmerDto>(key);
    if (cached) return cached;

    const { from, to, periodFrom, periodTo } = this.defaultPeriod();
    const authHeaders = this.forwardAuth(authorization);

    const farmBase = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
    const monitoringBase = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.MONITORING),
      SERVICE_URL_KEYS.MONITORING,
    );

    const activeContracts = await this.contractRepo.count({
      where: {
        partyFarmerId: user.sub,
        status: In(['active', 'pending_change']),
      },
    });

    const farmIds = await this.fetchFarmerFarmIds(farmBase, user.sub, authHeaders);
    let careLogCount = 0;
    for (const farmId of farmIds) {
      careLogCount += await this.countCareLogsTotal(farmBase, farmId, authHeaders);
    }

    let complianceScore = 0;
    const picked = await this.contractRepo.findOne({
      where: {
        partyFarmerId: user.sub,
        status: In(['active', 'pending_change']),
      },
      order: { createdAt: 'DESC' },
    });

    if (
      picked?.farmId &&
      picked.standardId &&
      farmIds.includes(picked.farmId)
    ) {
      try {
        const comp = await this.complianceService.getCompliance(
          picked.id,
          user,
          authorization,
        );
        complianceScore = comp.complianceScore;
      } catch (e) {
        this.logger.warn(
          `Dashboard farmer compliance: ${(e as Error).message}`,
        );
        complianceScore = await this.farmerComplianceFromLogs(
          farmBase,
          picked.farmId,
          from,
          to,
          authHeaders,
        );
      }
    } else if (farmIds.length > 0) {
      complianceScore = await this.farmerComplianceFromLogs(
        farmBase,
        farmIds[0],
        from,
        to,
        authHeaders,
      );
    } else if (picked?.farmId) {
      complianceScore = await this.farmerComplianceFromLogs(
        farmBase,
        picked.farmId,
        from,
        to,
        authHeaders,
      );
    }

    let recentAlerts = 0;
    for (const farmId of farmIds) {
      recentAlerts += await this.countUnackAlerts(
        monitoringBase,
        farmId,
        authHeaders,
      );
    }

    const dto: DashboardFarmerDto = {
      periodFrom,
      periodTo,
      complianceScore,
      recentAlerts,
      activeContracts,
      careLogCount,
    };

    await this.setCached(key, dto);
    return dto;
  }

  async getBuyerDashboard(user: JwtPayload): Promise<DashboardBuyerDto> {
    const key = `${CACHE_PREFIX.buyer}${user.sub}`;
    const cached = await this.getCached<DashboardBuyerDto>(key);
    if (cached) return cached;

    const { from, to, periodFrom, periodTo } = this.defaultPeriod();

    const openBuyingRequests = await this.buyingRequestRepo.count({
      where: { buyerId: user.sub, status: 'open' },
    });

    const pendingProposals = await this.proposalRepo
      .createQueryBuilder('p')
      .innerJoin(BuyingRequestEntity, 'br', 'br.id = p.buyingRequestId')
      .where('br.buyerId = :bid', { bid: user.sub })
      .andWhere('p.status = :st', { st: 'pending' })
      .getCount();

    const activeContracts = await this.contractRepo.count({
      where: {
        partyBuyerId: user.sub,
        status: In(['active', 'pending_change']),
      },
    });

    const completedOrders = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.buyerId = :bid', { bid: user.sub })
      .andWhere('o.status = :st', { st: 'completed' })
      .andWhere('o.createdAt >= :from', { from })
      .andWhere('o.createdAt <= :to', { to })
      .getCount();

    const dto: DashboardBuyerDto = {
      periodFrom,
      periodTo,
      openBuyingRequests,
      pendingProposals,
      activeContracts,
      completedOrders,
    };

    await this.setCached(key, dto);
    return dto;
  }

  private defaultPeriod(): {
    from: Date;
    to: Date;
    periodFrom: string;
    periodTo: string;
  } {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 30);
    return {
      from,
      to,
      periodFrom: from.toISOString().slice(0, 10),
      periodTo: to.toISOString().slice(0, 10),
    };
  }

  private forwardAuth(
    authorization?: string,
  ): Record<string, string> {
    if (!authorization) {
      throw new UnauthorizedException(
        'Thiếu header Authorization để gọi farm-service/monitoring-service.',
      );
    }
    return { Authorization: authorization };
  }

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.warn(`Đọc cache dashboard thất bại: ${(e as Error).message}`);
      return null;
    }
  }

  private async setCached<T>(key: string, dto: T): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(dto), 'EX', DASHBOARD_TTL_SEC);
    } catch (e) {
      this.logger.warn(`Ghi cache dashboard thất bại: ${(e as Error).message}`);
    }
  }

  private async fetchFarmerFarmIds(
    farmBase: string,
    ownerId: string,
    headers: Record<string, string>,
  ): Promise<string[]> {
    const base = farmBase.replace(/\/$/, '');
    const url = `${base}/api/v1/farms?ownerId=${encodeURIComponent(ownerId)}&limit=100`;
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`farm-service GET /farms ${res.status}`);
        return [];
      }
      const body = (await res.json()) as ListResponse<FarmDto>;
      return body.items.map((f) => f.id);
    } catch (err) {
      this.logger.warn(`farm-service không phản hồi: ${(err as Error).message}`);
      return [];
    }
  }

  private async countCareLogsTotal(
    farmBase: string,
    farmId: string,
    headers: Record<string, string>,
  ): Promise<number> {
    const base = `${farmBase.replace(/\/$/, '')}/api/v1/farms/${farmId}/care-logs?page=1&limit=1`;
    const res = await fetch(base, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      this.logger.warn(`farm-service care-logs ${res.status} farm=${farmId}`);
      return 0;
    }
    const body = (await res.json()) as ListResponse<CareLogDto>;
    return body.total;
  }

  private async fetchAllCareLogs(
    farmBase: string,
    farmId: string,
    headers: Record<string, string>,
  ): Promise<CareLogDto[]> {
    const base = `${farmBase.replace(/\/$/, '')}/api/v1/farms/${farmId}/care-logs`;
    const all: CareLogDto[] = [];
    let page = 1;
    const limit = 100;
    for (;;) {
      const url = `${base}?page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return all;
      }
      const body = (await res.json()) as ListResponse<CareLogDto>;
      all.push(...body.items);
      if (body.items.length < limit || all.length >= body.total) break;
      page += 1;
    }
    return all;
  }

  private async farmerComplianceFromLogs(
    farmBase: string,
    farmId: string,
    from: Date,
    to: Date,
    headers: Record<string, string>,
  ): Promise<number> {
    const logs = await this.fetchAllCareLogs(farmBase, farmId, headers);
    const fromMs = from.getTime();
    const toMs = to.getTime();
    const inPeriod = logs.filter((l) => {
      const t = new Date(l.performedAt).getTime();
      return t >= fromMs && t <= toMs;
    });
    if (inPeriod.length === 0) return 1;
    const dev = inPeriod.filter((l) => l.deviation).length;
    const ratio = dev / inPeriod.length;
    return Number(Math.max(0, Math.min(1, 1 - ratio * 0.6)).toFixed(4));
  }

  private async countUnackAlerts(
    monitoringBase: string,
    farmId: string,
    headers: Record<string, string>,
  ): Promise<number> {
    const base = monitoringBase.replace(/\/$/, '');
    const url = `${base}/api/v1/monitoring/farms/${farmId}/alerts?status=unacknowledged&page=1&limit=1`;
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`monitoring alerts ${res.status} farm=${farmId}`);
        return 0;
      }
      const body = (await res.json()) as ListResponse<{ id: string }>;
      return body.total;
    } catch (err) {
      this.logger.warn(`monitoring-service không phản hồi: ${(err as Error).message}`);
      return 0;
    }
  }
}
