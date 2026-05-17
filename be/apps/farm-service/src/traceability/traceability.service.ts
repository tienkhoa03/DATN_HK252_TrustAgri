import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TraceabilityDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { FarmEntity } from '../farms/entities/farm.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { StandardEntity } from '../standards/entities/standard.entity';

@Injectable()
export class TraceabilityService {
  private readonly logger = new Logger(TraceabilityService.name);

  constructor(
    @InjectRepository(FarmEntity)
    private readonly farmRepo: Repository<FarmEntity>,
    @InjectRepository(CareLogEntity)
    private readonly careLogRepo: Repository<CareLogEntity>,
    @InjectRepository(StandardEntity)
    private readonly standardRepo: Repository<StandardEntity>,
    private readonly configService: ConfigService,
  ) {}

  async getByQrCode(code: string): Promise<TraceabilityDto> {
    const farm = await this.findFarmByCode(code);
    await this.ensureTraceabilityCodePersisted(farm);

    let standard: TraceabilityDto['standard'];
    if (farm.standardId) {
      const std = await this.standardRepo.findOne({
        where: { id: farm.standardId },
      });
      if (std) {
        standard = { code: std.code, name: std.name };
      }
    }

    const logs = await this.careLogRepo.find({
      where: { farmId: farm.id },
      order: { performedAt: 'ASC' },
      take: 500,
    });

    const careLogTimeline = logs.map((l) => ({
      action: l.action,
      performedAt: l.performedAt.toISOString(),
      notes: l.notes ?? undefined,
    }));

    const sensorChart = await this.fetchSensorChart(farm.id);

    return {
      productCode: code,
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        cropType: farm.cropType,
      },
      standard,
      careLogTimeline,
      sensorChart,
    };
  }

  private async findFarmByCode(code: string): Promise<FarmEntity> {
    const farm = await this.farmRepo.findOne({
      where: [{ id: code }, { traceabilityCode: code }],
    });
    if (!farm) {
      throw new NotFoundException('Không tìm thấy thông tin truy xuất cho mã này');
    }
    return farm;
  }

  /** Backfill mã QR cho các vườn tạo trước khi có cột traceability_code */
  private async ensureTraceabilityCodePersisted(farm: FarmEntity): Promise<void> {
    if (farm.traceabilityCode) return;
    farm.traceabilityCode = `TR-${farm.id.replace(/-/g, '').slice(0, 12)}`;
    await this.farmRepo.save(farm);
  }

  private async fetchSensorChart(
    farmId: string,
  ): Promise<TraceabilityDto['sensorChart']> {
    const base = resolveServiceUrl(
      this.configService.get<string>(SERVICE_URL_KEYS.MONITORING),
      SERVICE_URL_KEYS.MONITORING,
    );
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    const q = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const url = `${base.replace(/\/$/, '')}/api/v1/monitoring/traceability/farms/${farmId}/sensor-chart?${q.toString()}`;

    const secret = this.configService.get<string>('TRACEABILITY_INTERNAL_SECRET');
    const headers: Record<string, string> = {};
    if (secret) {
      headers['X-Traceability-Internal'] = secret;
    }

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers,
      });
      if (!res.ok) {
        this.logger.warn(
          `monitoring-service sensor-chart ${res.status} cho farm ${farmId} — trả rỗng`,
        );
        return [];
      }
      return (await res.json()) as TraceabilityDto['sensorChart'];
    } catch (err) {
      this.logger.warn(
        `Không gọi được monitoring-service cho sensor-chart: ${(err as Error).message}`,
      );
      return [];
    }
  }
}
