import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareLogTimelineItemDto,
  InternalContractRefDto,
  ProcessComplianceSummaryDto,
  TraceabilityContractContextDto,
  TraceabilityDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { FarmEntity } from '../farms/entities/farm.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { CareAuditLogEntity } from '../care-logs/entities/care-audit-log.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import {
  fetchCurrentEnvironment,
  fetchComplianceCertificateByContractId,
  fetchContractByCode,
  fetchActiveContractForFarm,
} from './internal-clients';

const LATE_TOLERANCE_DAYS = 2;
const MAX_SENSOR_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class TraceabilityService {
  private readonly logger = new Logger(TraceabilityService.name);

  constructor(
    @InjectRepository(FarmEntity)
    private readonly farmRepo: Repository<FarmEntity>,
    @InjectRepository(CareLogEntity)
    private readonly careLogRepo: Repository<CareLogEntity>,
    @InjectRepository(CareAuditLogEntity)
    private readonly auditRepo: Repository<CareAuditLogEntity>,
    @InjectRepository(StandardEntity)
    private readonly standardRepo: Repository<StandardEntity>,
    private readonly configService: ConfigService,
  ) {}

  async getByQrCode(code: string): Promise<TraceabilityDto> {
    // ── Step 1: Determine mode ───────────────────────────────────────────────
    const isLotCode = /^LOT-/.test(code);

    // ── Step 2: Resolve farm + contract scope ────────────────────────────────
    let farm: FarmEntity;
    let contract: InternalContractRefDto | null = null;
    let scope: 'contract' | 'farm-overview';

    if (isLotCode) {
      contract = await fetchContractByCode(code, this.configService);
      if (!contract || !contract.farmId) {
        throw new NotFoundException('Không tìm thấy thông tin truy xuất cho mã này');
      }
      const found = await this.farmRepo.findOne({ where: { id: contract.farmId }, withDeleted: true });
      if (!found) throw new NotFoundException('Không tìm thấy vườn cho mã lô này');
      farm = found;
      scope = 'contract';
    } else {
      farm = await this.findFarmByCode(code);
      await this.ensureTraceabilityCodePersisted(farm);

      if (farm.currentContractId) {
        contract = await fetchActiveContractForFarm(farm.id, this.configService);
        scope = contract ? 'contract' : 'farm-overview';
      } else {
        scope = 'farm-overview';
      }
    }

    // ── Step 3: Standard ─────────────────────────────────────────────────────
    const standardId = (scope === 'contract' && contract?.standardId) ? contract.standardId : farm.standardId;
    let standard: TraceabilityDto['standard'];
    let steps: StandardStepEntity[] = [];

    if (standardId) {
      const std = await this.standardRepo.findOne({
        where: { id: standardId },
        relations: ['steps'],
      });
      if (std) {
        standard = { code: std.code, name: std.name };
        steps = [...(std.steps ?? [])].sort((a, b) => a.order - b.order);
      }
    }

    // ── Step 4: Care logs — filtered by contractId when in contract scope ────
    const logs = await this.careLogRepo.find({
      where: scope === 'contract' && contract
        ? { farmId: farm.id, contractId: contract.id }
        : { farmId: farm.id },
      relations: ['evidences', 'standardStep'],
      order: { performedAt: 'ASC' },
      take: 500,
    });

    const editedIds = await this.getEditedLogIds(logs.map((l) => l.id));
    const stepExpectedOffset = this.buildStepOffsetMap(steps);
    const plantingMs = farm.plantingDate ? new Date(farm.plantingDate).getTime() : null;

    const careLogTimeline: CareLogTimelineItemDto[] = logs.map((l) => {
      const isLate = this.computeIsLate(l, stepExpectedOffset, plantingMs);
      return {
        id: l.id,
        action: l.action,
        standardStepTitle: l.standardStep?.title ?? undefined,
        standardStepOrder: l.standardStep?.order ?? undefined,
        performedAt: l.performedAt.toISOString(),
        notes: l.notes ?? undefined,
        deviation: l.deviation ?? false,
        isLate,
        isEdited: editedIds.has(l.id),
        evidences: (l.evidences ?? []).map((e) => ({
          fileUrl: e.fileUrl,
          mimeType: e.mimeType,
          capturedAt: e.capturedAt.toISOString(),
        })),
      };
    });

    const process = steps.length > 0
      ? this.buildProcessSummary(steps, careLogTimeline)
      : undefined;

    // ── Step 5: IoT — sensor chart window + current environment ─────────────
    const [sensorChart, currentEnvironment, complianceCertificate] = await Promise.all([
      this.fetchSensorChart(farm.id, scope === 'contract' ? contract : null),
      this.shouldFetchCurrentEnv(scope, contract)
        ? fetchCurrentEnvironment(farm.id, this.configService)
        : Promise.resolve([]),
      scope === 'contract' && contract
        ? fetchComplianceCertificateByContractId(contract.id, this.configService)
        : Promise.resolve(undefined),
    ]);

    // ── Step 6: Contract context DTO ─────────────────────────────────────────
    let contractContext: TraceabilityContractContextDto | undefined;
    if (scope === 'contract' && contract) {
      contractContext = {
        id: contract.id,
        traceabilityCode: contract.traceabilityCode ?? code,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        plantingDate: contract.plantingDate ?? undefined,
        standardName: contract.standardName ?? undefined,
        productName: contract.productName ?? undefined,
        quantity: contract.quantity,
        unit: contract.unit,
      };
    }

    return {
      productCode: code,
      scope,
      contract: contractContext,
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        cropType: farm.cropType,
        area: farm.area,
        plantingDate: farm.plantingDate ?? undefined,
        ownerDisplayName: farm.ownerDisplayName ?? undefined,
      },
      standard,
      careLogTimeline,
      process,
      sensorChart,
      currentEnvironment,
      complianceCertificate,
    };
  }

  private shouldFetchCurrentEnv(
    scope: 'contract' | 'farm-overview',
    contract: InternalContractRefDto | null,
  ): boolean {
    if (scope === 'farm-overview') return true;
    // For contract scope, only show "live" env if contract is still active
    return contract?.status === 'active' || contract?.status === 'pending_change';
  }

  private async findFarmByCode(code: string): Promise<FarmEntity> {
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let farm: FarmEntity | null = null;

    // Only attempt uuid lookup when code is actually a valid UUID —
    // passing a non-uuid string (e.g. "TR-…") into a uuid column throws a
    // PostgreSQL "invalid input syntax for type uuid" error.
    // withDeleted: true — QR codes on packaging must remain scannable even
    // after a farm is soft-deleted.
    if (UUID_RE.test(code)) {
      farm = await this.farmRepo.findOne({ where: { id: code }, withDeleted: true });
    }

    if (!farm) {
      farm = await this.farmRepo.findOne({ where: { traceabilityCode: code }, withDeleted: true });
    }

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

  /** Trả về set care_log_id đã từng bị UPDATE (isEdited=true). */
  private async getEditedLogIds(logIds: string[]): Promise<Set<string>> {
    if (logIds.length === 0) return new Set();
    const edited = await this.auditRepo
      .createQueryBuilder('a')
      .select('a.care_log_id', 'careLogId')
      .where('a.care_log_id IN (:...ids)', { ids: logIds })
      .andWhere("a.action = 'UPDATE'")
      .distinct(true)
      .getRawMany<{ careLogId: string }>();
    return new Set(edited.map((r) => r.careLogId));
  }

  /**
   * Xây bảng stepId → expectedDayOffset (cộng dồn expectedDurationDays).
   * Bước có expectedDurationDays=null không tham gia tính isLate.
   */
  private buildStepOffsetMap(
    steps: StandardStepEntity[],
  ): Map<string, number | null> {
    const map = new Map<string, number | null>();
    let cumulative = 0;
    let hasNull = false;

    for (const step of steps) {
      if (step.expectedDurationDays == null) {
        hasNull = true;
      }
      if (hasNull) {
        map.set(step.id, null);
      } else {
        cumulative += step.expectedDurationDays!;
        map.set(step.id, cumulative);
      }
    }
    return map;
  }

  private computeIsLate(
    log: CareLogEntity,
    offsetMap: Map<string, number | null>,
    plantingMs: number | null,
  ): boolean {
    if (!log.standardStepId || plantingMs === null) return false;
    const expectedOffset = offsetMap.get(log.standardStepId);
    if (expectedOffset == null) return false;
    const actualOffset = (log.performedAt.getTime() - plantingMs) / 86_400_000;
    return actualOffset - expectedOffset > LATE_TOLERANCE_DAYS;
  }

  private buildProcessSummary(
    steps: StandardStepEntity[],
    timeline: CareLogTimelineItemDto[],
  ): ProcessComplianceSummaryDto {
    const completedStepIds = new Set(
      timeline
        .filter((l) => !l.deviation && !l.isLate && l.standardStepOrder !== undefined)
        .map((l) => {
          const step = steps.find((s) => s.title === l.standardStepTitle && s.order === l.standardStepOrder);
          return step?.id;
        })
        .filter((id): id is string => id !== undefined),
    );

    return {
      totalSteps: steps.length,
      completedSteps: completedStepIds.size,
      deviationCount: timeline.filter((l) => l.deviation).length,
      lateCount: timeline.filter((l) => l.isLate).length,
      coverageRatio: steps.length > 0 ? completedStepIds.size / steps.length : 0,
      steps: steps.map((s) => ({
        order: s.order,
        title: s.title,
        expectedDurationDays: s.expectedDurationDays,
        completed: completedStepIds.has(s.id),
      })),
    };
  }

  private async fetchSensorChart(
    farmId: string,
    contract: InternalContractRefDto | null,
  ): Promise<TraceabilityDto['sensorChart']> {
    const base = resolveServiceUrl(
      this.configService.get<string>(SERVICE_URL_KEYS.MONITORING),
      SERVICE_URL_KEYS.MONITORING,
    );

    let from: Date;
    let to: Date;

    if (contract) {
      const startMs = new Date(`${contract.startDate}T00:00:00.000Z`).getTime();
      const endMs = new Date(`${contract.endDate}T23:59:59.999Z`).getTime();
      const nowMs = Date.now();
      to = new Date(Math.min(endMs, nowMs));
      from = new Date(Math.max(startMs, to.getTime() - MAX_SENSOR_WINDOW_MS));
    } else {
      to = new Date();
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

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
