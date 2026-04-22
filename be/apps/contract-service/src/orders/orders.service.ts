import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  OrderDto,
  CreateOrderDto,
  ListResponse,
  BuyerTransactionSummaryDto,
} from '@trustagri/shared';
import { OrderEntity } from './entities/order.entity';
import { OrderQueryDto } from './dto/order-query.dto';
import { ProductEntity } from '../products/entities/product.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ContractAuditService } from '../contracts/contract-audit.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly contractAudit: ContractAuditService,
  ) {}

  /**
   * GET /api/v1/orders
   * Buyer thấy đơn hàng của mình; trader thấy đơn hàng thuộc sản phẩm của mình.
   * Hỗ trợ `buyerId=me`, `includeSummary`, `status`, `from`, `to`, phân trang.
   */
  async listOrders(
    query: OrderQueryDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<ListResponse<OrderDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const baseQb = this.buildOrderListQuery(query, requesterId, requesterRole);

    const [rows, total] = await baseQb
      .clone()
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let summary: BuyerTransactionSummaryDto | undefined;
    if (query.includeSummary) {
      summary = await this.computeOrderSummary(baseQb.clone());
    }

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
      ...(summary !== undefined ? { summary } : {}),
    };
  }

  private buildOrderListQuery(
    query: OrderQueryDto,
    requesterId: string,
    requesterRole: string,
  ): SelectQueryBuilder<OrderEntity> {
    const qb = this.orderRepo.createQueryBuilder('o');

    const buyerFilter = this.resolveBuyerIdForOrders(
      query.buyerId,
      requesterId,
      requesterRole,
    );

    if (requesterRole === 'buyer') {
      qb.andWhere('o.buyerId = :id', { id: buyerFilter ?? requesterId });
    } else if (requesterRole === 'trader') {
      qb.andWhere('o.traderId = :id', { id: requesterId });
      if (buyerFilter) {
        qb.andWhere('o.buyerId = :bid', { bid: buyerFilter });
      }
    }

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('o.createdAt >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('o.createdAt <= :to', { to: query.to });
    }

    return qb;
  }

  /**
   * `totalSpent` / `completedCount` theo cùng phạm vi lọc, không phụ thuộc trang.
   */
  private async computeOrderSummary(
    qb: SelectQueryBuilder<OrderEntity>,
  ): Promise<BuyerTransactionSummaryDto> {
    const raw = await qb
      .select(
        'COALESCE(SUM(CASE WHEN o.status = :done THEN o.totalPrice ELSE 0 END), 0)',
        'totalSpent',
      )
      .addSelect('COALESCE(SUM(CASE WHEN o.status = :done THEN 1 ELSE 0 END), 0)', 'completedCount')
      .setParameter('done', 'completed')
      .getRawOne();

    return {
      totalSpent: String(raw?.totalSpent ?? '0'),
      completedCount: Number(raw?.completedCount ?? 0),
    };
  }

  private resolveBuyerIdForOrders(
    raw: string | undefined,
    requesterId: string,
    requesterRole: string,
  ): string | null {
    if (raw === undefined || raw === '') {
      return null;
    }
    const trimmed = raw.trim();
    if (trimmed.toLowerCase() === 'me') {
      if (requesterRole !== 'buyer') {
        throw new ForbiddenException('Tham số buyerId=me chỉ dùng với vai trò buyer');
      }
      return requesterId;
    }
    if (!this.isUuidV4(trimmed)) {
      throw new BadRequestException('Tham số buyerId không hợp lệ');
    }
    if (requesterRole === 'buyer' && trimmed !== requesterId) {
      throw new ForbiddenException('Không được xem đơn hàng của người mua khác');
    }
    return trimmed;
  }

  private isUuidV4(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  /**
   * GET /api/v1/orders/:id
   */
  async getOrder(id: string): Promise<OrderDto> {
    const entity = await this.orderRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    return this.toDto(entity);
  }

  /**
   * POST /api/v1/orders (buyer)
   * Tạo đơn hàng từ sản phẩm marketplace. Tính totalPrice từ price * quantity.
   */
  async createOrder(dto: CreateOrderDto, buyerId: string): Promise<OrderDto> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    if (product.status !== 'active') {
      throw new BadRequestException('Sản phẩm không còn hoạt động');
    }

    const totalPrice = Number(product.price) * dto.quantity;

    const entity = this.orderRepo.create({
      buyerId,
      traderId: product.traderId,
      productId: dto.productId,
      quantity: dto.quantity,
      unit: dto.unit,
      totalPrice,
      deposit: dto.deposit ?? null,
      status: 'pending',
    });

    const saved = await this.orderRepo.save(entity);
    this.logger.log(`Order created: id=${saved.id} buyerId=${buyerId} traderId=${saved.traderId}`);
    return this.toDto(saved);
  }

  /**
   * POST /api/v1/orders/:id/accept (trader)
   * Chuyển trạng thái pending → contracted và tạo bản ghi hợp đồng.
   */
  async acceptOrder(id: string, traderId: string): Promise<OrderDto> {
    const entity = await this.requireOrder(id);

    if (entity.traderId !== traderId) {
      throw new ForbiddenException('Chỉ thương lái sở hữu sản phẩm mới có thể xác nhận đơn hàng');
    }
    if (entity.status !== 'pending') {
      throw new BadRequestException(
        `Không thể xác nhận đơn hàng ở trạng thái "${entity.status}"`,
      );
    }

    entity.status = 'contracted';
    const saved = await this.orderRepo.save(entity);

    await this.createContractFromOrder(saved);
    this.logger.log(`Order accepted → contracted: id=${id} traderId=${traderId}`);
    return this.toDto(saved);
  }

  /**
   * POST /api/v1/orders/:id/reject (trader)
   * Chuyển trạng thái pending → rejected.
   */
  async rejectOrder(id: string, traderId: string): Promise<OrderDto> {
    const entity = await this.requireOrder(id);

    if (entity.traderId !== traderId) {
      throw new ForbiddenException('Chỉ thương lái sở hữu sản phẩm mới có thể từ chối đơn hàng');
    }
    if (entity.status !== 'pending') {
      throw new BadRequestException(
        `Không thể từ chối đơn hàng ở trạng thái "${entity.status}"`,
      );
    }

    entity.status = 'rejected';
    const saved = await this.orderRepo.save(entity);
    this.logger.log(`Order rejected: id=${id} traderId=${traderId}`);
    return this.toDto(saved);
  }

  /**
   * POST /api/v1/orders/:id/cancel (buyer)
   * Hủy đơn hàng khi còn ở trạng thái pending.
   */
  async cancelOrder(id: string, buyerId: string): Promise<OrderDto> {
    const entity = await this.requireOrder(id);

    if (entity.buyerId !== buyerId) {
      throw new ForbiddenException('Chỉ người mua chủ sở hữu mới có thể hủy đơn hàng');
    }
    if (entity.status !== 'pending') {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái "${entity.status}"`,
      );
    }

    entity.status = 'cancelled';
    const saved = await this.orderRepo.save(entity);
    this.logger.log(`Order cancelled: id=${id} buyerId=${buyerId}`);
    return this.toDto(saved);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async requireOrder(id: string): Promise<OrderEntity> {
    const entity = await this.orderRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    return entity;
  }

  private async createContractFromOrder(order: OrderEntity): Promise<void> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contract = this.contractRepo.create({
      contractType: 'trader_buyer',
      partyTraderId: order.traderId,
      partyBuyerId: order.buyerId,
      partyFarmerId: null,
      productId: order.productId,
      standardId: null,
      farmId: null,
      quantity: order.quantity,
      unit: order.unit,
      totalPrice: order.totalPrice,
      deposit: order.deposit,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active',
      terms: `Hợp đồng được tạo tự động từ đơn hàng #${order.id}`,
      orderId: order.id,
      proposalId: null,
    });

    const saved = await this.contractRepo.save(contract);
    await this.contractAudit.logStatusChange(saved.id, null, saved.status, order.traderId);
    this.logger.log(`Contract auto-created from order: orderId=${order.id}`);
  }

  private toDto(entity: OrderEntity): OrderDto {
    return {
      id: entity.id,
      buyerId: entity.buyerId,
      traderId: entity.traderId,
      productId: entity.productId,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      totalPrice: Number(entity.totalPrice),
      deposit: entity.deposit !== null ? Number(entity.deposit) : undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
