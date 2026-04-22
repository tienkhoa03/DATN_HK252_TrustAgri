import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ContractDto,
  CreateContractDto,
  ListResponse,
  JwtPayload,
  BuyerTransactionSummaryDto,
} from '@trustagri/shared';
import { ContractEntity } from './entities/contract.entity';
import { ContractQueryDto } from './dto/contract-query.dto';
import { ContractAuditService } from './contract-audit.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly contractAudit: ContractAuditService,
  ) {}

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

  async create(dto: CreateContractDto, user: JwtPayload): Promise<ContractDto> {
    if (user.role === 'trader' && dto.partyTraderId !== user.sub) {
      throw new ForbiddenException('Thương lái chỉ có thể tạo hợp đồng với partyTraderId là chính mình');
    }

    this.validateCreateParties(dto);

    const entity = this.contractRepo.create({
      partyFarmerId: dto.partyFarmerId ?? null,
      partyTraderId: dto.partyTraderId,
      partyBuyerId: dto.partyBuyerId ?? null,
      contractType: dto.contractType,
      productId: dto.productId ?? null,
      standardId: dto.standardId ?? null,
      farmId: dto.farmId ?? null,
      quantity: dto.quantity,
      unit: dto.unit,
      totalPrice: dto.totalPrice,
      deposit: dto.deposit ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: 'active',
      terms: dto.terms,
      orderId: null,
      proposalId: null,
    });

    const saved = await this.contractRepo.save(entity);
    await this.contractAudit.logStatusChange(saved.id, null, saved.status, user.sub);
    return this.toDto(saved);
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

  async listAuditLogs(contractId: string, user: JwtPayload): Promise<ContractAuditLogEntryDto[]> {
    await this.getById(contractId, user);
    const rows = await this.contractAudit.findByContractId(contractId);
    return rows.map((r) => ({
      id: r.id,
      contractId: r.contractId,
      previousStatus: r.previousStatus,
      newStatus: r.newStatus,
      actorUserId: r.actorUserId,
      occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
    }));
  }

  private toDto(entity: ContractEntity): ContractDto {
    return {
      id: entity.id,
      partyFarmerId: entity.partyFarmerId ?? undefined,
      partyTraderId: entity.partyTraderId,
      partyBuyerId: entity.partyBuyerId ?? undefined,
      contractType: entity.contractType,
      productId: entity.productId ?? undefined,
      standardId: entity.standardId ?? undefined,
      farmId: entity.farmId ?? undefined,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      totalPrice: Number(entity.totalPrice),
      deposit: entity.deposit !== null ? Number(entity.deposit) : undefined,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      terms: entity.terms,
      createdAt: entity.createdAt.toISOString(),
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
  occurredAt: string;
}
