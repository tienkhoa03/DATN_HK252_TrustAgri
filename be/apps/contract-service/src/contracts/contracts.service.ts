import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContractDto,
  CreateContractDto,
  ListResponse,
  JwtPayload,
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

    const qb = this.contractRepo
      .createQueryBuilder('c')
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (user.role === 'admin') {
      // Admin: toàn bộ hợp đồng, lọc status / khoảng thời gian
    } else {
      const roleFilter = query.role ?? user.role;
      if (roleFilter !== user.role) {
        throw new ForbiddenException('Tham số role không khớp vai trò tài khoản');
      }
      if (roleFilter === 'farmer') {
        qb.andWhere('c.partyFarmerId = :uid', { uid: user.sub });
      } else if (roleFilter === 'trader') {
        qb.andWhere('c.partyTraderId = :uid', { uid: user.sub });
      } else if (roleFilter === 'buyer') {
        qb.andWhere('c.partyBuyerId = :uid', { uid: user.sub });
      } else {
        throw new ForbiddenException('Vai trò không được phép xem danh sách hợp đồng');
      }
    }

    if (query.status) {
      qb.andWhere('c.status = :st', { st: query.status });
    }
    if (query.from) {
      qb.andWhere('c.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('c.createdAt <= :to', { to: query.to });
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
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
  actorUserId: string;
  occurredAt: string;
}
