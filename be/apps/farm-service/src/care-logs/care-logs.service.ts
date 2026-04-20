import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareLogDto,
  CareLogSyncResponse,
  CreateCareLogDto,
  CreateEvidenceDto,
  EvidenceDto,
  ListResponse,
} from '@trustagri/shared';
import { CareLogEntity } from './entities/care-log.entity';
import { EvidenceEntity } from './entities/evidence.entity';
import { FarmEntity } from '../farms/entities/farm.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import { ListCareLogsQueryDto } from './dto/list-care-logs-query.dto';
import { SyncCareLogsDto } from './dto/sync-care-logs.dto';

@Injectable()
export class CareLogsService {
  private readonly logger = new Logger(CareLogsService.name);

  constructor(
    @InjectRepository(CareLogEntity)
    private readonly careLogRepo: Repository<CareLogEntity>,
    @InjectRepository(EvidenceEntity)
    private readonly evidenceRepo: Repository<EvidenceEntity>,
    @InjectRepository(FarmEntity)
    private readonly farmRepo: Repository<FarmEntity>,
    @InjectRepository(StandardStepEntity)
    private readonly stepRepo: Repository<StandardStepEntity>,
  ) {}

  async listCareLogs(
    farmId: string,
    query: ListCareLogsQueryDto,
  ): Promise<ListResponse<CareLogDto>> {
    await this.requireFarm(farmId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [rows, total] = await this.careLogRepo.findAndCount({
      where: { farmId },
      relations: ['evidences'],
      order: { performedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  async createCareLog(
    farmId: string,
    dto: CreateCareLogDto,
    userId: string,
  ): Promise<CareLogDto> {
    const farm = await this.requireFarmOwner(farmId, userId);

    const deviation = await this.detectDeviation(farm, dto.standardStepId);

    const entity = this.careLogRepo.create({
      farmId,
      standardStepId: dto.standardStepId ?? null,
      action: dto.action,
      notes: dto.notes ?? null,
      performedAt: new Date(dto.performedAt),
      deviation,
      syncStatus: 'synced',
      clientRecordId: dto.clientRecordId ?? null,
    });

    const saved = await this.careLogRepo.save(entity);
    const withEvidence = await this.careLogRepo.findOne({
      where: { id: saved.id },
      relations: ['evidences'],
    });
    return this.toDto(withEvidence!);
  }

  async syncCareLogs(
    farmId: string,
    dto: SyncCareLogsDto,
    userId: string,
  ): Promise<CareLogSyncResponse> {
    const farm = await this.requireFarmOwner(farmId, userId);

    const results: CareLogSyncResponse['results'] = [];

    for (const item of dto.items) {
      const { clientRecordId } = item;

      const existing = await this.careLogRepo.findOne({
        where: { clientRecordId },
      });

      if (existing) {
        results.push({
          clientRecordId,
          status: 'conflicted',
          serverId: existing.id,
          reason: 'Bản ghi đã tồn tại với clientRecordId này',
        });
        continue;
      }

      const performedAt = new Date(item.performedAt);

      const timeConflict = await this.careLogRepo.findOne({
        where: { farmId, performedAt },
      });

      if (timeConflict) {
        results.push({
          clientRecordId,
          status: 'conflicted',
          serverId: timeConflict.id,
          reason: `Xung đột thời gian: đã có nhật ký lúc ${item.performedAt}`,
        });
        continue;
      }

      try {
        const deviation = await this.detectDeviation(farm, item.standardStepId);

        const entity = this.careLogRepo.create({
          farmId,
          standardStepId: item.standardStepId ?? null,
          action: item.action,
          notes: item.notes ?? null,
          performedAt,
          deviation,
          syncStatus: 'synced',
          clientRecordId,
        });

        const saved = await this.careLogRepo.save(entity);
        results.push({ clientRecordId, status: 'accepted', serverId: saved.id });
      } catch (err) {
        this.logger.error(`Sync failed for clientRecordId=${clientRecordId}: ${(err as Error).message}`);
        results.push({
          clientRecordId,
          status: 'rejected',
          reason: (err as Error).message,
        });
      }
    }

    return { results };
  }

  async createEvidence(
    farmId: string,
    dto: CreateEvidenceDto,
    userId: string,
  ): Promise<EvidenceDto> {
    await this.requireFarmOwner(farmId, userId);

    const careLog = await this.careLogRepo.findOne({
      where: { id: dto.careLogId, farmId },
    });
    if (!careLog) {
      throw new NotFoundException(
        'Nhật ký chăm sóc không tồn tại hoặc không thuộc vườn này',
      );
    }

    const entity = this.evidenceRepo.create({
      careLogId: dto.careLogId,
      farmId,
      fileUrl: dto.fileUrl,
      mimeType: dto.mimeType,
      capturedAt: new Date(dto.capturedAt),
    });

    const saved = await this.evidenceRepo.save(entity);
    return this.toEvidenceDto(saved);
  }

  /**
   * Phát hiện deviation: standardStepId không khớp thứ tự bước kế tiếp.
   * Nếu farm không có standard hoặc không truyền standardStepId → false.
   */
  private async detectDeviation(
    farm: FarmEntity,
    standardStepId?: string,
  ): Promise<boolean> {
    if (!standardStepId || !farm.standardId) {
      return false;
    }

    const steps = await this.stepRepo.find({
      where: { standardId: farm.standardId },
      order: { order: 'ASC' },
    });

    if (steps.length === 0) return false;

    const completedCount = await this.careLogRepo.count({
      where: { farmId: farm.id },
    });

    const expectedStepIndex = completedCount % steps.length;
    const expectedStep = steps[expectedStepIndex];

    return expectedStep?.id !== standardStepId;
  }

  private async requireFarm(farmId: string): Promise<FarmEntity> {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Vườn không tồn tại');
    return farm;
  }

  private async requireFarmOwner(
    farmId: string,
    userId: string,
  ): Promise<FarmEntity> {
    const farm = await this.requireFarm(farmId);
    if (farm.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên vườn này');
    }
    return farm;
  }

  private toDto(entity: CareLogEntity): CareLogDto {
    return {
      id: entity.id,
      farmId: entity.farmId,
      standardStepId: entity.standardStepId ?? undefined,
      action: entity.action,
      notes: entity.notes ?? undefined,
      performedAt: entity.performedAt.toISOString(),
      evidences: (entity.evidences ?? []).map((e) => this.toEvidenceDto(e)),
      deviation: entity.deviation ?? undefined,
      syncStatus: entity.syncStatus,
      clientRecordId: entity.clientRecordId ?? undefined,
    };
  }

  private toEvidenceDto(entity: EvidenceEntity): EvidenceDto {
    return {
      id: entity.id,
      careLogId: entity.careLogId,
      fileUrl: entity.fileUrl,
      mimeType: entity.mimeType,
      capturedAt: entity.capturedAt.toISOString(),
    };
  }
}
