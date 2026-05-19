import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ContractChangeRequestDto,
  ContractDto,
  CreateContractChangeRequestDto,
  JwtPayload,
} from '@trustagri/shared';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ContractChangeRequestEntity } from './entities/contract-change-request.entity';
import { ContractAuditService } from '../contracts/contract-audit.service';
import {
  ContractChangedEventPayload,
  ContractEventPublisherService,
} from './services/contract-event-publisher.service';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

/** Các trường hợp đồng được phép đổi qua change-request (camelCase, khớp ContractDto). */
const ALLOWED_CONTRACT_KEYS = new Set([
  'quantity',
  'unit',
  'totalPrice',
  'deposit',
  'startDate',
  'endDate',
  'terms',
  'productId',
  'standardId',
  'farmId',
]);

@Injectable()
export class ContractChangeRequestsService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(ContractChangeRequestEntity)
    private readonly changeRepo: Repository<ContractChangeRequestEntity>,
    private readonly dataSource: DataSource,
    private readonly contractAudit: ContractAuditService,
    private readonly publisher: ContractEventPublisherService,
    private readonly authClient: AuthClientService,
  ) {}

  async list(
    contractId: string,
    user: JwtPayload,
  ): Promise<ContractChangeRequestDto[]> {
    const contract = await this.requireContract(contractId);
    this.assertParty(contract, user);
    const rows = await this.changeRepo.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toChangeDto(r));
  }

  async create(
    contractId: string,
    dto: CreateContractChangeRequestDto,
    user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    const contract = await this.requireContract(contractId);
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Chỉ các bên trong hợp đồng mới tạo yêu cầu thay đổi',
      );
    }
    this.assertParty(contract, user);

    if (contract.status !== 'active') {
      throw new BadRequestException(
        'Chỉ có thể tạo yêu cầu khi hợp đồng đang active',
      );
    }

    const pending = await this.changeRepo.findOne({
      where: { contractId, status: 'pending' },
    });
    if (pending) {
      throw new BadRequestException(
        'Đã có yêu cầu đang chờ phản hồi',
      );
    }

    const action = dto.action ?? 'modify';
    const changes = dto.changes ?? {};

    if (action === 'modify') {
      const keys = Object.keys(changes);
      if (keys.length === 0) {
        throw new BadRequestException('changes không được rỗng cho action=modify');
      }

      for (const key of keys) {
        if (!ALLOWED_CONTRACT_KEYS.has(key)) {
          throw new BadRequestException(`Trường không được phép thay đổi: ${key}`);
        }
        const entry = changes[key];
        if (
          !entry ||
          typeof entry !== 'object' ||
          !('oldValue' in entry) ||
          !('newValue' in entry)
        ) {
          throw new BadRequestException(
            `Mỗi mục trong changes phải có dạng { oldValue, newValue } (${key})`,
          );
        }
      }

      this.assertOldValuesMatchContract(contract, changes);
    }

    const [requestedSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(user.sub),
    ]);
    const requestedSnap = settledValue(requestedSnapRes);

    const saved = await this.dataSource.transaction(async (manager) => {
      const cRepo = manager.getRepository(ContractEntity);
      const crRepo = manager.getRepository(ContractChangeRequestEntity);

      const row = crRepo.create({
        contractId,
        action,
        requestedBy: user.sub,
        requestedByName: requestedSnap?.displayName ?? null,
        requestedByPhone: requestedSnap?.phone ?? null,
        changes,
        reason: dto.reason ?? null,
        status: 'pending',
        respondedBy: null,
        respondedByName: null,
        respondedAt: null,
      });
      const cr = await crRepo.save(row);

      const prevStatus = contract.status;
      await cRepo.update(contractId, { status: 'pending_change' });
      await this.contractAudit.logStatusChange(
        contractId,
        prevStatus,
        'pending_change',
        user.sub,
        manager,
      );

      return cr;
    });

    const updated = await this.requireContract(contractId);
    const changeDto = this.toChangeDto(saved);
    await this.publisher.publishContractChanged({
      contract: this.toContractDto(updated),
      changeRequest: changeDto,
    });

    return changeDto;
  }

  async accept(
    contractId: string,
    changeId: string,
    user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    const contract = await this.requireContract(contractId);
    const row = await this.changeRepo.findOne({
      where: { id: changeId, contractId },
    });
    if (!row) {
      throw new NotFoundException('Yêu cầu thay đổi không tồn tại');
    }
    this.assertResponderParty(contract, row, user);
    if (row.status !== 'pending') {
      throw new BadRequestException('Yêu cầu không còn ở trạng thái pending');
    }
    if (contract.status !== 'pending_change') {
      throw new BadRequestException('Trạng thái hợp đồng không khớp yêu cầu đang xử lý');
    }

    const [respondedSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(user.sub),
    ]);
    const respondedSnap = settledValue(respondedSnapRes);

    await this.dataSource.transaction(async (manager) => {
      const cRepo = manager.getRepository(ContractEntity);
      const crRepo = manager.getRepository(ContractChangeRequestEntity);
      const fresh = await cRepo.findOne({ where: { id: contractId } });
      if (!fresh) {
        throw new NotFoundException('Hợp đồng không tồn tại');
      }

      // Tùy action: 'cancel'/'complete' → đổi status terminal; 'modify' → apply diff & về active.
      const nextStatus: ContractEntity['status'] =
        row.action === 'cancel'
          ? 'cancelled'
          : row.action === 'complete'
            ? 'completed'
            : 'active';

      if (row.action === 'modify') {
        this.assertOldValuesMatchContract(fresh, row.changes);
        this.applyChanges(fresh, row.changes);
      }

      fresh.status = nextStatus;
      await cRepo.save(fresh);

      row.status = 'accepted';
      row.respondedBy = user.sub;
      row.respondedByName = respondedSnap?.displayName ?? null;
      row.respondedByPhone = respondedSnap?.phone ?? null;
      row.respondedAt = new Date();
      await crRepo.save(row);

      await this.contractAudit.logStatusChange(
        contractId,
        'pending_change',
        nextStatus,
        user.sub,
        manager,
      );
    });

    const updated = await this.requireContract(contractId);
    const reloaded = await this.changeRepo.findOne({
      where: { id: changeId },
    });
    if (!reloaded) {
      throw new NotFoundException();
    }
    const changeDto = this.toChangeDto(reloaded);
    await this.publisher.publishContractChanged({
      contract: this.toContractDto(updated),
      changeRequest: changeDto,
    });
    return changeDto;
  }

  async reject(
    contractId: string,
    changeId: string,
    user: JwtPayload,
  ): Promise<ContractChangeRequestDto> {
    const contract = await this.requireContract(contractId);
    const row = await this.changeRepo.findOne({
      where: { id: changeId, contractId },
    });
    if (!row) {
      throw new NotFoundException('Yêu cầu thay đổi không tồn tại');
    }
    this.assertResponderParty(contract, row, user);
    if (row.status !== 'pending') {
      throw new BadRequestException('Yêu cầu không còn ở trạng thái pending');
    }
    if (contract.status !== 'pending_change') {
      throw new BadRequestException('Trạng thái hợp đồng không khớp yêu cầu đang xử lý');
    }

    const [respondedSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(user.sub),
    ]);
    const respondedSnap = settledValue(respondedSnapRes);

    await this.dataSource.transaction(async (manager) => {
      const cRepo = manager.getRepository(ContractEntity);
      const crRepo = manager.getRepository(ContractChangeRequestEntity);

      const prev = contract.status;
      await cRepo.update(contractId, { status: 'active' });

      row.status = 'rejected';
      row.respondedBy = user.sub;
      row.respondedByName = respondedSnap?.displayName ?? null;
      row.respondedByPhone = respondedSnap?.phone ?? null;
      row.respondedAt = new Date();
      await crRepo.save(row);

      await this.contractAudit.logStatusChange(
        contractId,
        prev,
        'active',
        user.sub,
        manager,
      );
    });

    const updated = await this.requireContract(contractId);
    const reloaded = await this.changeRepo.findOne({
      where: { id: changeId },
    });
    if (!reloaded) {
      throw new NotFoundException();
    }
    const changeDto = this.toChangeDto(reloaded);
    await this.publisher.publishContractChanged({
      contract: this.toContractDto(updated),
      changeRequest: changeDto,
    });
    return changeDto;
  }

  private async requireContract(id: string): Promise<ContractEntity> {
    const c = await this.contractRepo.findOne({ where: { id } });
    if (!c) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    return c;
  }

  private assertParty(c: ContractEntity, user: JwtPayload): void {
    if (user.role === 'admin') {
      return;
    }
    const uid = user.sub;
    if (
      c.partyFarmerId === uid ||
      c.partyTraderId === uid ||
      c.partyBuyerId === uid
    ) {
      return;
    }
    throw new ForbiddenException('Không có quyền thao tác trên hợp đồng này');
  }

  /** Bên còn lại (không phải người gửi yêu cầu); không dùng tài khoản admin. */
  private assertResponderParty(
    c: ContractEntity,
    row: ContractChangeRequestEntity,
    user: JwtPayload,
  ): void {
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Chỉ các bên trong hợp đồng mới phản hồi yêu cầu thay đổi',
      );
    }
    const uid = user.sub;
    const isParty =
      c.partyFarmerId === uid ||
      c.partyTraderId === uid ||
      c.partyBuyerId === uid;
    if (!isParty) {
      throw new ForbiddenException('Không có quyền thao tác trên hợp đồng này');
    }
    if (row.requestedBy === uid) {
      throw new ForbiddenException('Chỉ bên không gửi yêu cầu mới được phản hồi');
    }
  }

  private assertOldValuesMatchContract(
    contract: ContractEntity,
    changes: Record<string, { oldValue: unknown; newValue: unknown }>,
  ): void {
    const snap = this.contractFieldSnapshot(contract);
    for (const key of Object.keys(changes)) {
      const expected = changes[key].oldValue;
      const actual = snap[key];
      if (!this.valuesEqual(expected, actual)) {
        throw new BadRequestException(
          `Giá trị oldValue không khớp trường ${key} trên hợp đồng hiện tại`,
        );
      }
    }
  }

  private contractFieldSnapshot(
    c: ContractEntity,
  ): Record<string, unknown> {
    return {
      quantity: Number(c.quantity),
      unit: c.unit,
      totalPrice: Number(c.totalPrice),
      deposit: c.deposit !== null ? Number(c.deposit) : null,
      startDate: c.startDate,
      endDate: c.endDate,
      terms: c.terms,
      productId: c.productId ?? null,
      standardId: c.standardId ?? null,
      farmId: c.farmId ?? null,
    };
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return a === b;
    }
    if (typeof a === 'number' || typeof b === 'number') {
      return Number(a) === Number(b);
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private applyChanges(
    entity: ContractEntity,
    changes: Record<string, { oldValue: unknown; newValue: unknown }>,
  ): void {
    for (const key of Object.keys(changes)) {
      const nv = changes[key].newValue;
      switch (key) {
        case 'quantity':
          entity.quantity = Number(nv);
          break;
        case 'totalPrice':
          entity.totalPrice = Number(nv);
          break;
        case 'deposit':
          entity.deposit =
            nv === null || nv === undefined || nv === ''
              ? null
              : Number(nv);
          break;
        case 'unit':
          entity.unit = String(nv);
          break;
        case 'startDate':
          entity.startDate = String(nv);
          break;
        case 'endDate':
          entity.endDate = String(nv);
          break;
        case 'terms':
          entity.terms = String(nv);
          break;
        case 'productId':
          entity.productId =
            nv === null || nv === undefined || nv === ''
              ? null
              : String(nv);
          break;
        case 'standardId':
          entity.standardId =
            nv === null || nv === undefined || nv === ''
              ? null
              : String(nv);
          break;
        case 'farmId':
          entity.farmId =
            nv === null || nv === undefined || nv === ''
              ? null
              : String(nv);
          break;
        default:
          break;
      }
    }
  }

  private toContractDto(entity: ContractEntity): ContractDto {
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
      quantity: Number(entity.quantity),
      unit: entity.unit,
      totalPrice: Number(entity.totalPrice),
      deposit: entity.deposit !== null ? Number(entity.deposit) : undefined,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      terms: entity.terms,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toChangeDto(row: ContractChangeRequestEntity): ContractChangeRequestDto {
    return {
      id: row.id,
      contractId: row.contractId,
      action: row.action ?? 'modify',
      requestedBy: row.requestedBy,
      requestedByName: row.requestedByName ?? null,
      requestedByPhone: row.requestedByPhone ?? null,
      changes: row.changes ?? {},
      reason: row.reason ?? undefined,
      status: row.status,
      respondedBy: row.respondedBy ?? undefined,
      respondedByName: row.respondedByName ?? null,
      respondedByPhone: row.respondedByPhone ?? null,
      createdAt: row.createdAt.toISOString(),
      respondedAt: row.respondedAt
        ? row.respondedAt.toISOString()
        : undefined,
    };
  }
}
