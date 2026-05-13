import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BuyingRequestDto,
  CreateBuyingRequestDto,
  ListResponse,
} from '@trustagri/shared';
import { BuyingRequestEntity } from './entities/buying-request.entity';
import { BuyingRequestQueryDto } from './dto/buying-request-query.dto';
import { UpdateBuyingRequestDto } from './dto/update-buying-request.dto';

@Injectable()
export class BuyingRequestsService {
  private readonly logger = new Logger(BuyingRequestsService.name);

  constructor(
    @InjectRepository(BuyingRequestEntity)
    private readonly buyingRequestRepo: Repository<BuyingRequestEntity>,
  ) {}

  /**
   * GET /api/v1/buying-requests
   * Danh sách buying request với lọc status, cropType, region.
   * Trader thấy tất cả; buyer chỉ thấy của chính mình (được xử lý ở controller).
   */
  async listBuyingRequests(
    query: BuyingRequestQueryDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<ListResponse<BuyingRequestDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.buyingRequestRepo
      .createQueryBuilder('br')
      .orderBy('br.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (requesterRole === 'buyer') {
      qb.andWhere('br.buyerId = :buyerId', { buyerId: requesterId });
    }

    if (query.status) {
      qb.andWhere('br.status = :status', { status: query.status });
    }

    if (query.cropType) {
      qb.andWhere('br.cropType = :cropType', { cropType: query.cropType });
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
   * GET /api/v1/buying-requests/:id
   * Chi tiết một buying request.
   */
  async getBuyingRequest(id: string): Promise<BuyingRequestDto> {
    const entity = await this.buyingRequestRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Nhu cầu mua hàng không tồn tại');
    }
    return this.toDto(entity);
  }

  /**
   * POST /api/v1/buying-requests (buyer)
   * Tạo nhu cầu mua hàng mới.
   */
  async createBuyingRequest(
    dto: CreateBuyingRequestDto,
    buyerId: string,
  ): Promise<BuyingRequestDto> {
    const entity = this.buyingRequestRepo.create({
      buyerId,
      cropType: dto.cropType,
      quantity: dto.quantity,
      unit: dto.unit,
      qualityStandardCode: dto.qualityStandardCode ?? null,
      expectedPrice: dto.expectedPrice ?? null,
      depositOffered: dto.depositOffered ?? null,
      deliveryDate: dto.deliveryDate,
      description: dto.description?.trim() ? dto.description.trim() : null,
      status: 'open',
    });

    const saved = await this.buyingRequestRepo.save(entity);
    this.logger.log(
      `BuyingRequest created: id=${saved.id} buyerId=${buyerId}`,
    );
    return this.toDto(saved);
  }

  /**
   * PUT /api/v1/buying-requests/:id (buyer owner)
   * Cập nhật nhu cầu mua hàng.
   */
  async updateBuyingRequest(
    id: string,
    dto: UpdateBuyingRequestDto,
    buyerId: string,
  ): Promise<BuyingRequestDto> {
    const entity = await this.requireBuyingRequest(id);
    this.ensureOwner(entity, buyerId);

    if (dto.cropType !== undefined) entity.cropType = dto.cropType;
    if (dto.quantity !== undefined) entity.quantity = dto.quantity;
    if (dto.unit !== undefined) entity.unit = dto.unit;
    if (dto.qualityStandardCode !== undefined)
      entity.qualityStandardCode = dto.qualityStandardCode ?? null;
    if (dto.expectedPrice !== undefined)
      entity.expectedPrice = dto.expectedPrice ?? null;
    if (dto.depositOffered !== undefined)
      entity.depositOffered = dto.depositOffered ?? null;
    if (dto.deliveryDate !== undefined) entity.deliveryDate = dto.deliveryDate;
    if (dto.description !== undefined) {
      entity.description = dto.description?.trim() ? dto.description.trim() : null;
    }
    if (dto.status !== undefined) entity.status = dto.status;

    const saved = await this.buyingRequestRepo.save(entity);
    this.logger.log(`BuyingRequest updated: id=${saved.id}`);
    return this.toDto(saved);
  }

  /**
   * DELETE /api/v1/buying-requests/:id (buyer owner) — soft delete
   * Xóa mềm nhu cầu mua hàng.
   */
  async deleteBuyingRequest(id: string, buyerId: string): Promise<void> {
    const entity = await this.requireBuyingRequest(id);
    this.ensureOwner(entity, buyerId);

    await this.buyingRequestRepo.softDelete(id);
    this.logger.log(
      `BuyingRequest soft-deleted: id=${id} buyerId=${buyerId}`,
    );
  }

  // ─── Private helpers ───────────────────────────────────────────────────────────

  private async requireBuyingRequest(id: string): Promise<BuyingRequestEntity> {
    const entity = await this.buyingRequestRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Nhu cầu mua hàng không tồn tại');
    }
    return entity;
  }

  private ensureOwner(entity: BuyingRequestEntity, buyerId: string): void {
    if (entity.buyerId !== buyerId) {
      throw new ForbiddenException(
        'Chỉ người mua chủ sở hữu mới có thể thay đổi nhu cầu mua hàng này',
      );
    }
  }

  private toDto(entity: BuyingRequestEntity): BuyingRequestDto {
    return {
      id: entity.id,
      buyerId: entity.buyerId,
      cropType: entity.cropType,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      qualityStandardCode: entity.qualityStandardCode ?? undefined,
      expectedPrice:
        entity.expectedPrice !== null
          ? Number(entity.expectedPrice)
          : undefined,
      depositOffered:
        entity.depositOffered !== null
          ? Number(entity.depositOffered)
          : undefined,
      deliveryDate: entity.deliveryDate,
      description: entity.description ?? undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
