import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ContractDto,
  CreateContractDto,
  ListResponse,
  JwtPayload,
  BuyerTransactionSummaryDto,
  FarmDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { ContractEntity } from './entities/contract.entity';
import { ContractQueryDto } from './dto/contract-query.dto';
import { ContractAuditService } from './contract-audit.service';
import { ConnectionsService } from '../connections/connections.service';
import { AuthClientService } from '../clients/auth-client.service';
import { FarmClientService } from '../clients/farm-client.service';
import { settledValue } from '../clients/settled.util';
import type { UserDenormSnapshot } from '@trustagri/shared';
import { ContractEventPublisherService } from '../contract-change-requests/services/contract-event-publisher.service';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly contractAudit: ContractAuditService,
    private readonly config: ConfigService,
    private readonly connectionsService: ConnectionsService,
    private readonly authClient: AuthClientService,
    private readonly farmClient: FarmClientService,
    @Optional()
    private readonly contractPublisher?: ContractEventPublisherService,
  ) {}

  /**
   * Lấy hợp đồng farmer_trader active của trader — dùng khi tạo product/proposal.
   * Throw BadRequestException nếu không tìm thấy hoặc không khớp.
   */
  async getActiveFarmerTraderContract(
    contractId: string,
    traderId: string,
  ): Promise<ContractEntity> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new BadRequestException('Hợp đồng với nông dân không tồn tại.');
    }
    if (contract.contractType !== 'farmer_trader') {
      throw new BadRequestException('Hợp đồng không phải loại farmer_trader.');
    }
    if (contract.status !== 'active') {
      throw new BadRequestException('Hợp đồng với nông dân chưa có hiệu lực (chỉ chấp nhận hợp đồng đang active).');
    }
    if (contract.partyTraderId !== traderId) {
      throw new ForbiddenException('Hợp đồng này không thuộc về bạn.');
    }
    if (contract.deletedAt) {
      throw new BadRequestException('Hợp đồng đã bị xóa.');
    }
    return contract;
  }

  /**
   * Vườn có hợp đồng farmer_trader trạng thái active (đã ký, đang hiệu lực) với thương lái.
   */
  async assertTraderFarmLinked(traderId: string, farmId: string): Promise<void> {
    const ok = await this.contractRepo.exists({
      where: {
        partyTraderId: traderId,
        farmId,
        contractType: 'farmer_trader',
        status: 'active',
      },
    });
    if (!ok) {
      throw new BadRequestException(
        'Vườn không thuộc hợp đồng nông dân–thương lái đã ký (đang hiệu lực) của bạn.',
      );
    }
  }

  /**
   * Danh sách vườn từ farm-service — chỉ các farmId có hợp đồng active với trader.
   * Mỗi vườn trả về kèm `currentContractId` = ID hợp đồng farmer_trader active mới nhất giữa trader & farm.
   */
  async listTraderLinkedFarms(
    traderId: string,
    authorization?: string,
  ): Promise<FarmDto[]> {
    const rows = await this.contractRepo
      .createQueryBuilder('c')
      .select(['c.id AS "contractId"', 'c.farmId AS "farmId"', 'c.updatedAt AS "updatedAt"'])
      .where('c.partyTraderId = :tid', { tid: traderId })
      .andWhere('c.contractType = :ctype', { ctype: 'farmer_trader' })
      .andWhere('c.status = :st', { st: 'active' })
      .andWhere('c.farmId IS NOT NULL')
      .andWhere('c.deletedAt IS NULL')
      .orderBy('c.updatedAt', 'DESC')
      .getRawMany<{ contractId: string; farmId: string; updatedAt: Date }>();

    // Group: farmId → latest contractId
    const farmToContract = new Map<string, string>();
    for (const r of rows) {
      if (!farmToContract.has(r.farmId)) {
        farmToContract.set(r.farmId, r.contractId);
      }
    }

    if (farmToContract.size === 0) {
      return [];
    }

    const farmBase = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (authorization) {
      headers.Authorization = authorization;
    }

    const results = await Promise.all(
      Array.from(farmToContract.keys()).map((id) => this.fetchFarmJson(farmBase, id, headers)),
    );
    return results
      .filter((f): f is FarmDto => f !== null)
      .map((f) => ({ ...f, currentContractId: farmToContract.get(f.id) ?? null }));
  }

  private async fetchFarmJson(
    farmBase: string,
    farmId: string,
    headers: Record<string, string>,
  ): Promise<FarmDto | null> {
    const url = `${farmBase.replace(/\/$/, '')}/api/v1/farms/${farmId}`;
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`farm-service GET /farms/${farmId} → ${res.status}`);
        return null;
      }
      return (await res.json()) as FarmDto;
    } catch (err) {
      this.logger.warn(
        `farm-service không đọc được vườn ${farmId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async list(
    query: ContractQueryDto,
    user: JwtPayload,
  ): Promise<ListResponse<ContractDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const baseQb = this.buildContractListQuery(query, user);

    const [rows, total] = await baseQb
      .clone()
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let summary: BuyerTransactionSummaryDto | undefined;
    if (query.includeSummary) {
      summary = await this.computeContractSummary(baseQb.clone());
    }

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
      ...(summary !== undefined ? { summary } : {}),
    };
  }

  private buildContractListQuery(
    query: ContractQueryDto,
    user: JwtPayload,
  ): SelectQueryBuilder<ContractEntity> {
    const qb = this.contractRepo.createQueryBuilder('c');

    this.applyContractPartyFilters(qb, query, user);

    if (query.status) {
      qb.andWhere('c.status = :st', { st: query.status });
    }
    if (query.from) {
      qb.andWhere('c.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('c.createdAt <= :to', { to: query.to });
    }

    return qb;
  }

  private applyContractPartyFilters(
    qb: SelectQueryBuilder<ContractEntity>,
    query: ContractQueryDto,
    user: JwtPayload,
  ): void {
    const resolvedBuyer = this.resolveBuyerIdForContracts(query.buyerId, user);

    if (user.role === 'admin') {
      if (query.buyerId?.trim().toLowerCase() === 'me') {
        throw new ForbiddenException('Tham số buyerId=me không dùng với admin');
      }
      if (resolvedBuyer) {
        qb.andWhere('c.partyBuyerId = :adminBuyer', { adminBuyer: resolvedBuyer });
      }
      return;
    }

    const roleFilter = query.role ?? user.role;
    if (roleFilter !== user.role) {
      throw new ForbiddenException('Tham số role không khớp vai trò tài khoản');
    }

    if (user.role === 'farmer') {
      if (query.buyerId) {
        throw new BadRequestException('Tham số buyerId không áp dụng cho nông dân');
      }
      qb.andWhere('c.partyFarmerId = :uid', { uid: user.sub });
      return;
    }

    if (user.role === 'buyer') {
      const targetBuyer = resolvedBuyer ?? user.sub;
      qb.andWhere('c.partyBuyerId = :uid', { uid: targetBuyer });
      return;
    }

    if (user.role === 'trader') {
      qb.andWhere('c.partyTraderId = :uid', { uid: user.sub });
      if (resolvedBuyer) {
        qb.andWhere('c.partyBuyerId = :bid', { bid: resolvedBuyer });
      }
      return;
    }

    throw new ForbiddenException('Vai trò không được phép xem danh sách hợp đồng');
  }

  private resolveBuyerIdForContracts(
    raw: string | undefined,
    user: JwtPayload,
  ): string | null {
    if (raw === undefined || raw === '') {
      return null;
    }
    const trimmed = raw.trim();
    if (trimmed.toLowerCase() === 'me') {
      if (user.role !== 'buyer') {
        throw new ForbiddenException('Tham số buyerId=me chỉ dùng với vai trò buyer');
      }
      return user.sub;
    }
    if (!this.isUuidV4(trimmed)) {
      throw new BadRequestException('Tham số buyerId không hợp lệ');
    }
    if (user.role === 'buyer' && trimmed !== user.sub) {
      throw new ForbiddenException('Không được xem hợp đồng của người mua khác');
    }
    return trimmed;
  }

  private isUuidV4(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async computeContractSummary(
    qb: SelectQueryBuilder<ContractEntity>,
  ): Promise<BuyerTransactionSummaryDto> {
    const raw = await qb
      .select(
        'COALESCE(SUM(CASE WHEN c.status = :done THEN c.totalPrice ELSE 0 END), 0)',
        'totalSpent',
      )
      .addSelect('COALESCE(SUM(CASE WHEN c.status = :done THEN 1 ELSE 0 END), 0)', 'completedCount')
      .setParameter('done', 'completed')
      .getRawOne();

    // TypeORM returns numeric columns as strings — keep as string to avoid
    // precision loss for VND amounts that can exceed Number.MAX_SAFE_INTEGER.
    return {
      totalSpent: String(raw?.totalSpent ?? '0'),
      completedCount: Number(raw?.completedCount ?? 0),
    };
  }

  async getById(id: string, user: JwtPayload): Promise<ContractDto> {
    const entity = await this.contractRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    this.assertCanAccessContract(entity, user);
    return this.toDto(entity);
  }

  async create(
    dto: CreateContractDto,
    user: JwtPayload,
    authorization?: string,
  ): Promise<ContractDto> {
    if (user.role === 'trader' && dto.partyTraderId !== user.sub) {
      throw new ForbiddenException('Thương lái chỉ có thể tạo hợp đồng với partyTraderId là chính mình');
    }

    this.validateCreateParties(dto);

    if (dto.farmId) {
      await this.assertFarmHasNoOngoingContract(dto.farmId);
    }

    const partyTraderId =
      user.role === 'trader' ? user.sub : dto.partyTraderId;

    const denorm = await this.resolveContractPartyDenorm(
      {
        partyFarmerId: dto.partyFarmerId ?? null,
        partyTraderId,
        partyBuyerId: dto.partyBuyerId ?? null,
        farmId: dto.farmId ?? null,
        standardId: dto.standardId ?? null,
      },
      authorization,
    );

    const entity = this.contractRepo.create({
      partyFarmerId: dto.partyFarmerId ?? null,
      partyTraderId,
      partyBuyerId: dto.partyBuyerId ?? null,
      partyFarmerName: denorm.partyFarmerName,
      partyFarmerPhone: denorm.partyFarmerPhone,
      partyTraderName: denorm.partyTraderName,
      partyTraderPhone: denorm.partyTraderPhone,
      partyBuyerName: denorm.partyBuyerName,
      partyBuyerPhone: denorm.partyBuyerPhone,
      contractType: dto.contractType,
      productId: dto.productId ?? null,
      standardId: dto.standardId ?? null,
      farmId: dto.farmId ?? null,
      farmName: denorm.farmName,
      standardName: denorm.standardName,
      quantity: dto.quantity,
      unit: dto.unit,
      totalPrice: dto.totalPrice,
      deposit: dto.deposit ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      plantingDate: dto.plantingDate ?? null,
      status: 'pending_signature',
      terms: dto.terms,
      orderId: null,
      proposalId: null,
      farmerSignedAt: null,
      traderSignedAt: null,
      buyerSignedAt: null,
    });

    const saved = await this.contractRepo.save(entity);
    await this.contractAudit.logStatusChange(saved.id, null, saved.status, user.sub);
    return this.toDto(saved);
  }

  /** Gọi Auth Service lấy displayName + phone; Farm Service lấy farmName + standardName — ghi vào INSERT. */
  private async resolveContractPartyDenorm(
    parties: {
      partyFarmerId: string | null;
      partyTraderId: string;
      partyBuyerId: string | null;
      farmId: string | null;
      standardId: string | null;
    },
    authorization?: string,
  ): Promise<{
    partyFarmerName: string | null;
    partyFarmerPhone: string | null;
    partyTraderName: string | null;
    partyTraderPhone: string | null;
    partyBuyerName: string | null;
    partyBuyerPhone: string | null;
    farmName: string | null;
    standardName: string | null;
  }> {
    if (parties.standardId && !authorization?.trim()) {
      this.logger.warn(
        'Thiếu header Authorization khi denorm standardName — GET /standards/:id trên farm-service yêu cầu JWT',
      );
    }

    const [farmerSnapRes, traderSnapRes, buyerSnapRes, standardNameRes, farmNameRes] =
      await Promise.allSettled([
        parties.partyFarmerId
          ? this.authClient.getUserSnapshot(parties.partyFarmerId)
          : Promise.resolve(null),
        this.authClient.getUserSnapshot(parties.partyTraderId),
        parties.partyBuyerId
          ? this.authClient.getUserSnapshot(parties.partyBuyerId)
          : Promise.resolve(null),
        parties.standardId
          ? this.farmClient.getStandardName(parties.standardId, authorization)
          : Promise.resolve(null),
        parties.farmId
          ? this.farmClient.getFarmName(parties.farmId, authorization)
          : Promise.resolve(null),
      ]);

    const farmerSnap = settledValue(farmerSnapRes);
    const traderSnap = settledValue(traderSnapRes);
    const buyerSnap = settledValue(buyerSnapRes);

    this.logDenormMiss('partyFarmer', parties.partyFarmerId, farmerSnap);
    this.logDenormMiss('partyTrader', parties.partyTraderId, traderSnap);
    this.logDenormMiss('partyBuyer', parties.partyBuyerId, buyerSnap);

    return {
      partyFarmerName: farmerSnap?.displayName ?? null,
      partyFarmerPhone: farmerSnap?.phone ?? null,
      partyTraderName: traderSnap?.displayName ?? null,
      partyTraderPhone: traderSnap?.phone ?? null,
      partyBuyerName: buyerSnap?.displayName ?? null,
      partyBuyerPhone: buyerSnap?.phone ?? null,
      farmName: settledValue(farmNameRes),
      standardName: settledValue(standardNameRes),
    };
  }

  private logDenormMiss(
    label: string,
    userId: string | null,
    snap: UserDenormSnapshot | null,
  ): void {
    if (!userId || snap?.displayName) return;
    this.logger.warn(
      `Auth không trả displayName cho ${label} userId=${userId} — kiểm tra AUTH_SERVICE_URL và GET /auth/users/:id`,
    );
  }

  /**
   * Mỗi vườn chỉ được có 1 hợp đồng farmer_trader chưa kết thúc tại một thời điểm.
   * excludeContractId: loại trừ hợp đồng đang xét (dùng khi kiểm tra lúc ký).
   */
  private async assertFarmHasNoOngoingContract(
    farmId: string,
    excludeContractId?: string,
  ): Promise<void> {
    const qb = this.contractRepo
      .createQueryBuilder('c')
      .where('c.farmId = :farmId', { farmId })
      .andWhere('c.contractType = :ctype', { ctype: 'farmer_trader' })
      .andWhere('c.status NOT IN (:...terminal)', {
        terminal: ['completed', 'cancelled'],
      })
      .andWhere('c.deletedAt IS NULL');

    if (excludeContractId) {
      qb.andWhere('c.id != :eid', { eid: excludeContractId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new ConflictException(
        'Vườn đã có hợp đồng đang thực hiện. Mỗi vườn chỉ được có một hợp đồng tại một thời điểm.',
      );
    }
  }

  private validateCreateParties(dto: CreateContractDto): void {
    if (dto.contractType === 'farmer_trader') {
      if (!dto.partyFarmerId) {
        throw new BadRequestException('Hợp đồng farmer_trader yêu cầu partyFarmerId');
      }
      if (dto.partyBuyerId) {
        throw new BadRequestException('Hợp đồng farmer_trader không dùng partyBuyerId');
      }
    } else {
      if (!dto.partyBuyerId) {
        throw new BadRequestException('Hợp đồng trader_buyer yêu cầu partyBuyerId');
      }
      if (dto.partyFarmerId) {
        throw new BadRequestException('Hợp đồng trader_buyer không dùng partyFarmerId');
      }
    }
  }

  private assertCanAccessContract(entity: ContractEntity, user: JwtPayload): void {
    if (user.role === 'admin') {
      return;
    }
    const uid = user.sub;
    if (
      entity.partyFarmerId === uid ||
      entity.partyTraderId === uid ||
      entity.partyBuyerId === uid
    ) {
      return;
    }
    throw new ForbiddenException('Không có quyền xem hợp đồng này');
  }

  /**
   * POST /contracts/:id/sign — bên liên quan ký hợp đồng.
   * Khi cả 2 bên ký xong, status chuyển pending_signature → active.
   */
  async sign(id: string, user: JwtPayload): Promise<ContractDto> {
    const entity = await this.contractRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    this.assertCanAccessContract(entity, user);

    if (entity.status !== 'pending_signature') {
      throw new ConflictException('Hợp đồng không ở trạng thái chờ ký');
    }

    const now = new Date();

    if (user.role === 'farmer') {
      if (entity.partyFarmerId !== user.sub) {
        throw new ForbiddenException('Bạn không phải nông dân trong hợp đồng này');
      }
      if (entity.farmerSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
      entity.farmerSignedAt = now;
    } else if (user.role === 'trader') {
      if (entity.partyTraderId !== user.sub) {
        throw new ForbiddenException('Bạn không phải thương lái trong hợp đồng này');
      }
      if (entity.traderSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
      entity.traderSignedAt = now;
    } else if (user.role === 'buyer') {
      if (entity.partyBuyerId !== user.sub) {
        throw new ForbiddenException('Bạn không phải người mua trong hợp đồng này');
      }
      if (entity.buyerSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
      entity.buyerSignedAt = now;
    } else {
      throw new ForbiddenException('Vai trò không được phép ký hợp đồng');
    }

    // Khi cả 2 bên ký xong → chuyển sang active
    const bothSigned =
      entity.contractType === 'farmer_trader'
        ? entity.farmerSignedAt != null && entity.traderSignedAt != null
        : entity.traderSignedAt != null && entity.buyerSignedAt != null;

    const previousStatus = entity.status;
    if (bothSigned) {
      if (entity.farmId && entity.contractType === 'farmer_trader') {
        await this.assertFarmHasNoOngoingContract(entity.farmId, entity.id);
      }
      entity.status = 'active';
    }

    const saved = await this.contractRepo.save(entity);

    if (saved.status !== previousStatus) {
      await this.contractAudit.logStatusChange(saved.id, previousStatus, saved.status, user.sub);
    }

    this.logger.log(`Contract ${id} signed by ${user.sub} (${user.role}); both_signed=${bothSigned}`);

    // Khi cả hai bên ký xong hợp đồng farmer_trader → gắn standard vào vườn (nếu có)
    if (bothSigned && entity.contractType === 'farmer_trader' && entity.farmId && entity.standardId) {
      await this.farmClient
        .applyStandardToFarm(entity.farmId, entity.standardId)
        .catch((err) =>
          this.logger.warn(
            `applyStandardToFarm failed for farm ${entity.farmId}: ${(err as Error).message}`,
          ),
        );
    }

    // Khi cả hai bên ký xong và hợp đồng có plantingDate → cập nhật ngày bắt đầu quy trình cho vườn
    if (bothSigned && entity.contractType === 'farmer_trader' && entity.farmId && entity.plantingDate) {
      await this.farmClient
        .setPlantingDate(entity.farmId, entity.plantingDate)
        .catch((err) =>
          this.logger.warn(
            `setPlantingDate failed for farm ${entity.farmId}: ${(err as Error).message}`,
          ),
        );
    }

    // Khi cả hai bên ký xong hợp đồng farmer_trader → gắn currentContractId cho vườn
    if (bothSigned && entity.contractType === 'farmer_trader' && entity.farmId) {
      await this.farmClient
        .setCurrentContract(entity.farmId, entity.id)
        .catch((err) =>
          this.logger.warn(
            `setCurrentContract failed for farm ${entity.farmId}: ${(err as Error).message}`,
          ),
        );
    }

    // Khi cả hai bên ký xong hợp đồng farmer_trader → tự động đánh dấu kết nối là 'signed'
    if (bothSigned && entity.contractType === 'farmer_trader') {
      await this.connectionsService
        .markConnectionSignedByContract(
          entity.partyFarmerId ?? '',
          entity.partyTraderId,
          entity.farmId ?? null,
        )
        .catch((err) =>
          this.logger.warn(
            `markConnectionSignedByContract failed: ${(err as Error).message}`,
          ),
        );
    }

    return this.toDto(saved);
  }

  /**
   * POST /contracts/:id/reject — bên chưa ký từ chối hợp đồng pending_signature.
   */
  async reject(id: string, user: JwtPayload, reason?: string): Promise<ContractDto> {
    const entity = await this.contractRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    this.assertCanAccessContract(entity, user);

    if (entity.status !== 'pending_signature') {
      throw new ConflictException('Hợp đồng không ở trạng thái chờ ký');
    }

    if (user.role === 'farmer') {
      if (entity.partyFarmerId !== user.sub) {
        throw new ForbiddenException('Bạn không phải nông dân trong hợp đồng này');
      }
      if (entity.farmerSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
    } else if (user.role === 'trader') {
      if (entity.partyTraderId !== user.sub) {
        throw new ForbiddenException('Bạn không phải thương lái trong hợp đồng này');
      }
      if (entity.traderSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
    } else if (user.role === 'buyer') {
      if (entity.partyBuyerId !== user.sub) {
        throw new ForbiddenException('Bạn không phải người mua trong hợp đồng này');
      }
      if (entity.buyerSignedAt) {
        throw new ConflictException('Bạn đã ký hợp đồng này rồi');
      }
    } else {
      throw new ForbiddenException('Vai trò không được phép từ chối hợp đồng');
    }

    const previousStatus = entity.status;
    entity.status = 'cancelled';
    const saved = await this.contractRepo.save(entity);

    await this.contractAudit.logStatusChange(saved.id, previousStatus, saved.status, user.sub);

    const reasonNote = reason?.trim() ? ` reason="${reason.trim()}"` : '';
    this.logger.log(`Contract ${id} rejected by ${user.sub} (${user.role});${reasonNote}`);

    const dto = this.toDto(saved);
    await this.contractPublisher
      ?.publishContractChanged({ contract: dto })
      .catch((err) =>
        this.logger.warn(
          `publishContractChanged after reject failed: ${(err as Error).message}`,
        ),
      );

    return dto;
  }

  async listAuditLogs(contractId: string, user: JwtPayload): Promise<ContractAuditLogEntryDto[]> {
    await this.getById(contractId, user);
    const rows = await this.contractAudit.findByContractId(contractId);
    return rows.map((r) => ({
      id: r.id,
      contractId: r.contractId,
      previousStatus: r.previousStatus,
      newStatus: r.newStatus,
      actorUserId: r.actorUserId,
      actorDisplayName: r.actorDisplayName ?? null,
      actorPhone: r.actorPhone ?? null,
      occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
    }));
  }

  private toDto(entity: ContractEntity): ContractDto {
    return {
      id: entity.id,
      partyFarmerId: entity.partyFarmerId ?? undefined,
      partyTraderId: entity.partyTraderId,
      partyBuyerId: entity.partyBuyerId ?? undefined,
      partyFarmerName: entity.partyFarmerName ?? null,
      partyFarmerPhone: entity.partyFarmerPhone ?? null,
      partyTraderName: entity.partyTraderName ?? null,
      partyTraderPhone: entity.partyTraderPhone ?? null,
      partyBuyerName: entity.partyBuyerName ?? null,
      partyBuyerPhone: entity.partyBuyerPhone ?? null,
      contractType: entity.contractType,
      productId: entity.productId ?? undefined,
      standardId: entity.standardId ?? undefined,
      farmId: entity.farmId ?? undefined,
      farmName: entity.farmName ?? null,
      standardName: entity.standardName ?? null,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      totalPrice: Number(entity.totalPrice),
      deposit: entity.deposit !== null ? Number(entity.deposit) : undefined,
      startDate: entity.startDate,
      endDate: entity.endDate,
      plantingDate: entity.plantingDate ?? null,
      status: entity.status,
      terms: entity.terms,
      farmerSignedAt: entity.farmerSignedAt?.toISOString(),
      traderSignedAt: entity.traderSignedAt?.toISOString(),
      buyerSignedAt: entity.buyerSignedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      sourceContractId: entity.sourceContractId ?? undefined,
    };
  }
}

/** Bản ghi audit (JSON camelCase qua Nest). */
export interface ContractAuditLogEntryDto {
  id: string;
  contractId: string;
  previousStatus: string | null;
  newStatus: string;
  actorUserId: string | null;
  actorDisplayName?: string | null;
  actorPhone?: string | null;
  occurredAt: string;
}
