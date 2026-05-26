import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  ContractDto,
  TraceabilityDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';
import { FarmEntity } from '../farms/entities/farm.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import { ContractClientService } from '../clients/contract-client.service';

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
    private readonly contractClient: ContractClientService,
  ) {}

  /**
   * Tra cứu thông tin truy xuất theo mã QR công khai.
   * - Mã `TRC-…` → contract-based: lấy contract, farm, parties, care-logs theo phạm vi hợp đồng.
   * - Mã `TR-…` hoặc UUID → farm-based (fallback cho dữ liệu cũ): lấy farm + toàn bộ care-logs.
   */
  async getByQrCode(code: string): Promise<TraceabilityDto> {
    // Ưu tiên contract code (prefix TRC- hoặc bất kỳ code nào contract-service biết)
    if (this.looksLikeContractCode(code)) {
      const contract = await this.contractClient.getByTraceCode(code);
      if (contract) {
        return this.buildContractTrace(code, contract);
      }
    }
    return this.buildFarmTrace(code);
  }

  // ─── Contract-based trace ──────────────────────────────────────────────

  private async buildContractTrace(
    code: string,
    contract: ContractDto,
  ): Promise<TraceabilityDto> {
    if (!contract.farmId) {
      // Trade contract không gắn farm — không đủ dữ liệu trace
      throw new NotFoundException(
        'Hợp đồng không có vườn liên kết — không thể truy xuất',
      );
    }

    const farm = await this.farmRepo.findOne({
      where: { id: contract.farmId },
      withDeleted: true,
    });
    if (!farm) {
      throw new NotFoundException('Vườn của hợp đồng không tồn tại');
    }

    // Standard: ưu tiên contract.standardId, fallback farm.standardId
    const standardId = contract.standardId ?? farm.standardId ?? null;
    let standard: TraceabilityDto['standard'];
    if (standardId) {
      const std = await this.standardRepo.findOne({ where: { id: standardId } });
      if (std) standard = { code: std.code, name: std.name };
    }

    // Care logs trong khoảng hợp đồng: từ plantingDate (hoặc startDate) đến endDate.
    const from = new Date(contract.plantingDate ?? contract.startDate);
    const to = new Date(contract.endDate);
    // Bao gồm cả ngày cuối — cộng 1 ngày
    to.setDate(to.getDate() + 1);

    const logs = await this.careLogRepo.find({
      where: {
        farmId: farm.id,
        performedAt: Between(from, to),
      },
      relations: ['standardStep'],
      order: { performedAt: 'ASC' },
      take: 500,
    });

    const careLogTimeline = logs.map((l) => ({
      action: l.action,
      standardStepTitle: l.standardStep?.title ?? undefined,
      performedAt: l.performedAt.toISOString(),
      notes: l.notes ?? undefined,
    }));

    const sensorChart = await this.fetchSensorChart(
      farm.id,
      from.toISOString(),
      to.toISOString(),
    );

    return {
      productCode: code,
      contract: {
        id: contract.id,
        contractType: contract.contractType,
        status: contract.status,
        productName: contract.farmName ?? null,
        quantity: contract.quantity,
        unit: contract.unit,
        startDate: contract.startDate,
        endDate: contract.endDate,
        plantingDate: contract.plantingDate ?? null,
        signedAt:
          contract.farmerSignedAt ?? contract.traderSignedAt ?? null,
        sourceContractId: contract.sourceContractId ?? null,
      },
      farmer: {
        name: contract.partyFarmerName ?? null,
        phone: contract.partyFarmerPhone ?? null,
      },
      trader: {
        name: contract.partyTraderName ?? null,
        phone: contract.partyTraderPhone ?? null,
      },
      buyer:
        contract.partyBuyerName || contract.partyBuyerPhone
          ? {
              name: contract.partyBuyerName ?? null,
              phone: contract.partyBuyerPhone ?? null,
            }
          : undefined,
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

  // ─── Farm-based trace (legacy fallback) ────────────────────────────────

  private async buildFarmTrace(code: string): Promise<TraceabilityDto> {
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
      relations: ['standardStep'],
      order: { performedAt: 'ASC' },
      take: 500,
    });

    const careLogTimeline = logs.map((l) => ({
      action: l.action,
      standardStepTitle: l.standardStep?.title ?? undefined,
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

  private looksLikeContractCode(code: string): boolean {
    return /^TRC-/i.test(code);
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

  private async fetchSensorChart(
    farmId: string,
    fromIso?: string,
    toIso?: string,
  ): Promise<TraceabilityDto['sensorChart']> {
    const base = resolveServiceUrl(
      this.configService.get<string>(SERVICE_URL_KEYS.MONITORING),
      SERVICE_URL_KEYS.MONITORING,
    );
    const to = toIso ? new Date(toIso) : new Date();
    const from = fromIso
      ? new Date(fromIso)
      : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
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
