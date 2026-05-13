import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDto, CreateProductDto, ListResponse } from '@trustagri/shared';
import { ProductEntity } from './entities/product.entity';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly contractsService: ContractsService,
  ) {}

  /**
   * GET /api/v1/products (public)
   * Danh sách sản phẩm với lọc theo cropType, region, priceMin, priceMax, traderId.
   */
  async listProducts(query: ProductQueryDto): Promise<ListResponse<ProductDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.cropType) {
      qb.andWhere('p.cropType = :cropType', { cropType: query.cropType });
    }

    if (query.traderId) {
      qb.andWhere('p.traderId = :traderId', { traderId: query.traderId });
    }

    if (query.priceMin !== undefined) {
      qb.andWhere('CAST(p.price AS numeric) >= :priceMin', {
        priceMin: query.priceMin,
      });
    }

    if (query.priceMax !== undefined) {
      qb.andWhere('CAST(p.price AS numeric) <= :priceMax', {
        priceMax: query.priceMax,
      });
    }

    if (query.region) {
      // Lọc theo vùng thương lái thông qua bảng users (trader_profile JSONB)
      qb.andWhere(
        `p.traderId IN (
          SELECT user_id FROM users
          WHERE trader_profile->>'region' = :region
        )`,
        { region: query.region },
      );
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
   * GET /api/v1/products/:id (public)
   * Chi tiết sản phẩm.
   */
  async getProduct(id: string): Promise<ProductDto> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return this.toDto(product);
  }

  /**
   * POST /api/v1/products (trader)
   * Tạo sản phẩm mới.
   */
  async createProduct(
    dto: CreateProductDto,
    traderId: string,
  ): Promise<ProductDto> {
    const farmId = dto.farmId?.trim();
    if (!farmId) {
      throw new BadRequestException(
        'Vui lòng chọn vườn từ hợp đồng nông dân–thương lái đã ký (đang hiệu lực).',
      );
    }
    await this.contractsService.assertTraderFarmLinked(traderId, farmId);

    const entity = this.productRepo.create({
      traderId,
      farmId,
      name: dto.name,
      cropType: dto.cropType,
      unit: dto.unit,
      price: dto.price,
      currency: 'VND',
      images: dto.images,
      standardCode: dto.standardCode ?? null,
      stockQuantity: dto.stockQuantity ?? null,
      description: dto.description ?? null,
      status: 'active',
    });

    const saved = await this.productRepo.save(entity);
    this.logger.log(`Product created: id=${saved.id} traderId=${traderId}`);
    return this.toDto(saved);
  }

  /**
   * PUT /api/v1/products/:id (trader owner)
   * Cập nhật sản phẩm.
   */
  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    traderId: string,
  ): Promise<ProductDto> {
    const product = await this.requireProduct(id);
    this.ensureOwner(product, traderId);

    if (dto.farmId !== undefined) {
      const nextFarm = dto.farmId?.trim();
      if (!nextFarm) {
        throw new BadRequestException(
          'Sản phẩm phải gắn vườn từ hợp đồng đã ký (đang hiệu lực).',
        );
      }
      await this.contractsService.assertTraderFarmLinked(traderId, nextFarm);
      product.farmId = nextFarm;
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.cropType !== undefined) product.cropType = dto.cropType;
    if (dto.unit !== undefined) product.unit = dto.unit;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.standardCode !== undefined)
      product.standardCode = dto.standardCode ?? null;
    if (dto.stockQuantity !== undefined)
      product.stockQuantity = dto.stockQuantity ?? null;
    if (dto.description !== undefined)
      product.description = dto.description ?? null;
    if (dto.status !== undefined) product.status = dto.status;

    const saved = await this.productRepo.save(product);
    this.logger.log(`Product updated: id=${saved.id}`);
    return this.toDto(saved);
  }

  /**
   * DELETE /api/v1/products/:id (trader owner) — soft delete
   * Xóa mềm sản phẩm.
   */
  async deleteProduct(id: string, traderId: string): Promise<void> {
    const product = await this.requireProduct(id);
    this.ensureOwner(product, traderId);

    await this.productRepo.softDelete(id);
    this.logger.log(`Product soft-deleted: id=${id} traderId=${traderId}`);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────────

  private async requireProduct(id: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }

  private ensureOwner(product: ProductEntity, traderId: string): void {
    if (product.traderId !== traderId) {
      throw new ForbiddenException(
        'Chỉ thương lái chủ sở hữu mới có thể thay đổi sản phẩm này',
      );
    }
  }

  private toDto(entity: ProductEntity): ProductDto {
    return {
      id: entity.id,
      traderId: entity.traderId,
      farmId: entity.farmId ?? undefined,
      name: entity.name,
      cropType: entity.cropType,
      unit: entity.unit,
      price: Number(entity.price),
      currency: 'VND',
      images: entity.images,
      standardCode: entity.standardCode ?? undefined,
      stockQuantity: entity.stockQuantity ?? undefined,
      description: entity.description ?? undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
