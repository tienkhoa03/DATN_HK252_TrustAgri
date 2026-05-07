import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FarmDto, CreateFarmDto, UpdateFarmDto, ListResponse } from '@trustagri/shared';
import { FarmEntity } from './entities/farm.entity';
import { ListFarmsQueryDto } from './dto/list-farms-query.dto';

@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  constructor(
    @InjectRepository(FarmEntity)
    private readonly farmRepo: Repository<FarmEntity>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateFarmDto, ownerId: string): Promise<FarmDto> {
    const farm = this.farmRepo.create({
      ownerId,
      name: dto.name,
      location: dto.location,
      area: dto.area,
      cropType: dto.cropType,
      standardId: dto.standardId ?? null,
      plantingDate: dto.plantingDate ?? null,
    });
    const saved = await this.farmRepo.save(farm);
    if (!saved.traceabilityCode) {
      saved.traceabilityCode = this.buildTraceabilityCode(saved.id);
      await this.farmRepo.save(saved);
    }
    return this.toDto(saved);
  }

  /** Mã ngắn ổn định theo farmId — dùng cho QR truy xuất công khai */
  buildTraceabilityCode(farmId: string): string {
    return `TR-${farmId.replace(/-/g, '').slice(0, 12)}`;
  }

  async list(query: ListFarmsQueryDto): Promise<ListResponse<FarmDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.farmRepo.createQueryBuilder('farm');

    if (query.keyword) {
      qb.andWhere('farm.name ILIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.region) {
      qb.andWhere("farm.location->>'province' = :region", {
        region: query.region,
      });
    }
    if (query.cropType) {
      qb.andWhere('farm.crop_type = :cropType', { cropType: query.cropType });
    }
    if (query.ownerId) {
      qb.andWhere('farm.owner_id = :ownerId', { ownerId: query.ownerId });
    }

    qb.orderBy('farm.created_at', 'DESC').skip(skip).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  async findOne(id: string): Promise<FarmDto> {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) {
      throw new NotFoundException('Vườn không tồn tại');
    }
    return this.toDto(farm);
  }

  async update(
    id: string,
    dto: UpdateFarmDto,
    requesterId: string,
  ): Promise<FarmDto> {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) {
      throw new NotFoundException('Vườn không tồn tại');
    }
    if (farm.ownerId !== requesterId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật vườn này');
    }

    if (dto.name !== undefined) farm.name = dto.name;
    if (dto.location !== undefined) farm.location = dto.location;
    if (dto.area !== undefined) farm.area = dto.area;
    if (dto.cropType !== undefined) farm.cropType = dto.cropType;
    if (dto.standardId !== undefined) farm.standardId = dto.standardId ?? null;
    if (dto.plantingDate !== undefined) farm.plantingDate = dto.plantingDate ?? null;

    const saved = await this.farmRepo.save(farm);
    return this.toDto(saved);
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) {
      throw new NotFoundException('Vườn không tồn tại');
    }
    if (farm.ownerId !== requesterId) {
      throw new ForbiddenException('Bạn không có quyền xóa vườn này');
    }

    await this.checkNoActiveContracts(id);

    await this.farmRepo.softRemove(farm);
  }

  /**
   * Kiểm tra xem vườn có hợp đồng active không trước khi xóa.
   * Gọi sang contract-service; nếu service chưa sẵn sàng thì bỏ qua (fail-open).
   */
  private async checkNoActiveContracts(farmId: string): Promise<void> {
    const contractServiceUrl = this.configService.get<string>(
      'CONTRACT_SERVICE_URL',
      'http://contract-service:3004',
    );

    try {
      const url = `${contractServiceUrl}/api/v1/contracts?farmId=${farmId}&status=active&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        this.logger.warn(
          `contract-service trả về ${res.status} khi kiểm tra hợp đồng active cho farm ${farmId}; bỏ qua kiểm tra.`,
        );
        return;
      }

      const body = (await res.json()) as { total?: number; items?: unknown[] };
      const total = body.total ?? body.items?.length ?? 0;

      if (total > 0) {
        throw new ConflictException(
          'Không thể xóa vườn đang có hợp đồng active. Hãy kết thúc hoặc hủy hợp đồng trước.',
        );
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      this.logger.warn(
        `Không thể kết nối contract-service để kiểm tra hợp đồng active cho farm ${farmId}: ${(err as Error).message}. Bỏ qua kiểm tra.`,
      );
    }
  }

  private toDto(farm: FarmEntity): FarmDto {
    return {
      id: farm.id,
      ownerId: farm.ownerId,
      name: farm.name,
      location: farm.location,
      area: farm.area,
      cropType: farm.cropType,
      standardId: farm.standardId ?? undefined,
      plantingDate: farm.plantingDate ?? undefined,
      createdAt: farm.createdAt.toISOString(),
      updatedAt: farm.updatedAt.toISOString(),
    };
  }
}
