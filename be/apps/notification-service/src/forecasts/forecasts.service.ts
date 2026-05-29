import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ForecastCreateDto,
  ForecastDto,
  ForecastUpdateDto,
  ListResponse,
} from '@trustagri/shared';
import { ForecastEntity } from './forecast.entity';
import { ForecastListQueryDto } from './dto/forecast-list-query.dto';
import { PriceTrendDto, PriceTrendPoint } from './dto/price-trend.dto';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class ForecastsService {
  constructor(
    @InjectRepository(ForecastEntity)
    private readonly repo: Repository<ForecastEntity>,
    private readonly authClient: AuthClientService,
  ) {}

  private toDto(e: ForecastEntity): ForecastDto {
    return {
      id: e.id,
      traderId: e.traderId,
      traderDisplayName: e.traderDisplayName ?? null,
      traderPhone: e.traderPhone ?? null,
      region: e.region,
      cropType: e.cropType,
      type: e.type,
      forecastData: e.forecastData,
      validFrom: e.validFrom.toISOString(),
      validTo: e.validTo.toISOString(),
      createdAt: e.createdAt.toISOString(),
    };
  }

  async list(
    query: ForecastListQueryDto,
  ): Promise<ListResponse<ForecastDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('f')
      .orderBy('f.validFrom', 'DESC');

    if (query.region) {
      qb.andWhere('f.region = :region', { region: query.region });
    }
    if (query.type) {
      qb.andWhere('f.type = :type', { type: query.type });
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((e) => this.toDto(e)),
      page,
      limit,
      total,
    };
  }

  /**
   * FR-G02: aggregate biểu đồ giá công khai cho Guest. Lấy forecast `price` mới nhất
   * theo từng cropType, trả series (cap `days` điểm gần nhất). KHÔNG trả PII thương lái.
   */
  async aggregatePriceTrends(
    cropType?: string,
    days = 7,
  ): Promise<PriceTrendDto[]> {
    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.type = :type', { type: 'price' })
      .orderBy('f.cropType', 'ASC')
      .addOrderBy('f.validFrom', 'DESC');

    if (cropType) {
      qb.andWhere('f.cropType = :cropType', { cropType });
    }

    const rows = await qb.getMany();

    // Giữ forecast mới nhất cho mỗi cropType (rows đã sort validFrom DESC).
    const latestByCrop = new Map<string, ForecastEntity>();
    for (const row of rows) {
      if (!latestByCrop.has(row.cropType)) {
        latestByCrop.set(row.cropType, row);
      }
    }

    return [...latestByCrop.values()].map((e) => {
      const fd = e.forecastData ?? {};
      const rawSeries = Array.isArray(fd.series) ? fd.series : [];
      const series: PriceTrendPoint[] = rawSeries
        .filter((s) => typeof s?.price === 'number')
        .map((s) => ({ day: String(s.day ?? ''), price: s.price as number }))
        .slice(-days);

      return {
        cropType: e.cropType,
        productLabel: fd.productLabel ?? null,
        trend: fd.trend ?? null,
        changePercent: fd.changePercent ?? null,
        series,
        updatedAt: (e.updatedAt ?? e.createdAt).toISOString(),
      };
    });
  }

  async create(
    traderId: string,
    dto: ForecastCreateDto,
  ): Promise<ForecastDto> {
    const [traderSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(traderId),
    ]);
    const traderSnap = settledValue(traderSnapRes);

    const entity = this.repo.create({
      traderId,
      traderDisplayName: traderSnap?.displayName ?? null,
      traderPhone: traderSnap?.phone ?? null,
      region: dto.region,
      cropType: dto.cropType,
      type: dto.type,
      forecastData: dto.forecastData,
      validFrom: new Date(dto.validFrom),
      validTo: new Date(dto.validTo),
    });
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(
    traderId: string,
    id: string,
    dto: ForecastUpdateDto,
  ): Promise<ForecastDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Dự báo không tồn tại');
    }
    if (row.traderId !== traderId) {
      throw new ForbiddenException('Bạn không có quyền sửa dự báo này');
    }
    if (dto.region !== undefined) row.region = dto.region;
    if (dto.cropType !== undefined) row.cropType = dto.cropType;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.forecastData !== undefined) row.forecastData = dto.forecastData;
    if (dto.validFrom !== undefined) row.validFrom = new Date(dto.validFrom);
    if (dto.validTo !== undefined) row.validTo = new Date(dto.validTo);
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }
}
