import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  CareLogDto,
  ComplianceDto,
  JwtPayload,
  ListResponse,
  SensorReadingDto,
  StandardDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { ContractsService } from './contracts.service';

const COMPLIANCE_CACHE_PREFIX = 'compliance:v1:';
const COMPLIANCE_CACHE_TTL_SEC = 300;

@Injectable()
export class ComplianceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ComplianceService.name);
  private redis: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly contractsService: ContractsService,
  ) {}

  onModuleInit(): void {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    this.redis.on('error', (err: Error) =>
      this.logger.warn(`Redis (compliance cache): ${err.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }

  async getCompliance(
    contractId: string,
    user: JwtPayload,
    authorization?: string,
  ): Promise<ComplianceDto> {
    const contract = await this.contractsService.getById(contractId, user);

    const cacheKey = `${COMPLIANCE_CACHE_PREFIX}${contractId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    if (!contract.farmId) {
      throw new BadRequestException(
        'Hợp đồng không có farmId — không đối chiếu tuân thủ được.',
      );
    }
    if (!contract.standardId) {
      throw new BadRequestException(
        'Hợp đồng không gắn tiêu chuẩn canh tác (standardId).',
      );
    }

    const farmBase = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
    const monitoringBase = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.MONITORING),
      SERVICE_URL_KEYS.MONITORING,
    );

    const authHeaders = this.forwardAuth(authorization);

    const standard = await this.fetchStandard(
      farmBase,
      contract.standardId,
      authHeaders,
    );
    const careLogs = await this.fetchAllCareLogs(
      farmBase,
      contract.farmId,
      authHeaders,
    );
    const rangeLogs = this.filterLogsByContractWindow(
      careLogs,
      contract.startDate,
      contract.endDate,
    );

    const fromIso = `${contract.startDate}T00:00:00.000Z`;
    const toIso = `${contract.endDate}T23:59:59.999Z`;
    const sensorReadings = await this.fetchSensorHistory(
      monitoringBase,
      contract.farmId,
      fromIso,
      toIso,
      authHeaders,
    );

    const dto = this.buildComplianceDto(
      contractId,
      standard,
      rangeLogs,
      sensorReadings,
    );

    await this.saveToCache(cacheKey, dto);
    return dto;
  }

  private async getFromCache(key: string): Promise<ComplianceDto | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as ComplianceDto;
    } catch (e) {
      this.logger.warn(`Đọc cache compliance thất bại: ${(e as Error).message}`);
      return null;
    }
  }

  private async saveToCache(key: string, dto: ComplianceDto): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(dto), 'EX', COMPLIANCE_CACHE_TTL_SEC);
    } catch (e) {
      this.logger.warn(`Ghi cache compliance thất bại: ${(e as Error).message}`);
    }
  }

  private forwardAuth(
    authorization?: string,
  ): Record<string, string> | undefined {
    if (!authorization) {
      throw new BadRequestException('Thiếu header Authorization để gọi dịch vụ nông trại/giám sát.');
    }
    return { Authorization: authorization };
  }

  private async fetchStandard(
    farmBase: string,
    standardId: string,
    headers: Record<string, string>,
  ): Promise<StandardDto> {
    const url = `${farmBase.replace(/\/$/, '')}/api/v1/standards/${standardId}`;
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) {
      throw new NotFoundException('Tiêu chuẩn canh tác không tồn tại');
    }
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `farm-service không đọc được tiêu chuẩn (${res.status})`,
      );
    }
    return res.json() as Promise<StandardDto>;
  }

  private async fetchAllCareLogs(
    farmBase: string,
    farmId: string,
    headers: Record<string, string>,
  ): Promise<CareLogDto[]> {
    const base = `${farmBase.replace(/\/$/, '')}/api/v1/farms/${farmId}/care-logs`;
    const all: CareLogDto[] = [];
    let page = 1;
    const limit = 100;

    for (;;) {
      const url = `${base}?page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new ServiceUnavailableException(
          `farm-service không đọc được nhật ký chăm sóc (${res.status})`,
        );
      }
      const body = (await res.json()) as ListResponse<CareLogDto>;
      all.push(...body.items);
      if (body.items.length < limit || all.length >= body.total) {
        break;
      }
      page += 1;
    }
    return all;
  }

  private filterLogsByContractWindow(
    logs: CareLogDto[],
    startDate: string,
    endDate: string,
  ): CareLogDto[] {
    const fromMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
    const toMs = new Date(`${endDate}T23:59:59.999Z`).getTime();
    return logs.filter((l) => {
      const t = new Date(l.performedAt).getTime();
      return t >= fromMs && t <= toMs;
    });
  }

  private async fetchSensorHistory(
    monitoringBase: string,
    farmId: string,
    from: string,
    to: string,
    headers: Record<string, string>,
  ): Promise<SensorReadingDto[]> {
    const q = new URLSearchParams({ from, to });
    const url = `${monitoringBase.replace(/\/$/, '')}/api/v1/monitoring/farms/${farmId}/history?${q.toString()}`;
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      this.logger.warn(
        `monitoring-service history ${res.status} — bỏ qua hệ số cảm biến`,
      );
      return [];
    }
    return res.json() as Promise<SensorReadingDto[]>;
  }

  private buildComplianceDto(
    contractId: string,
    standard: StandardDto,
    logs: CareLogDto[],
    sensorReadings: SensorReadingDto[],
  ): ComplianceDto {
    const steps = [...(standard.steps ?? [])].sort((a, b) => a.order - b.order);
    const totalSteps = steps.length;

    const deviations: ComplianceDto['deviations'] = [];
    for (const log of logs) {
      if (log.deviation) {
        deviations.push({
          careLogId: log.id,
          stepId: log.standardStepId ?? '',
          reason:
            'Ghi nhận lệch quy trình (deviation) hoặc không đúng thứ tự bước chuẩn',
          detectedAt: log.performedAt,
        });
      }
    }

    let completedSteps = 0;
    if (totalSteps > 0) {
      for (const step of steps) {
        const ok = logs.some(
          (l) => !l.deviation && l.standardStepId === step.id,
        );
        if (ok) completedSteps += 1;
      }
    }

    const stepRatio = totalSteps > 0 ? completedSteps / totalSteps : 1;
    const deviationPenalty = Math.min(0.55, deviations.length * 0.08);
    let afterDeviations = stepRatio * (1 - deviationPenalty);

    let sensorFactor = 1;
    if (sensorReadings.length > 0) {
      const imputed = sensorReadings.filter((r) => r.isImputed).length;
      const ratio = imputed / sensorReadings.length;
      sensorFactor = 1 - Math.min(0.35, ratio * 0.45);
    }

    let complianceScore = Math.max(
      0,
      Math.min(1, afterDeviations * sensorFactor),
    );
    complianceScore = Number(complianceScore.toFixed(4));

    const lastComputedAt = new Date().toISOString();

    return {
      contractId,
      standardCode: standard.code,
      totalSteps,
      completedSteps,
      deviations,
      complianceScore,
      lastComputedAt,
    };
  }
}
