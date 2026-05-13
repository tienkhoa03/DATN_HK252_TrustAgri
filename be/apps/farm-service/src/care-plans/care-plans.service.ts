import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CarePlanResponseDto,
  CompleteTaskResponseDto,
  DailyTaskDto,
} from '@trustagri/shared';
import { FarmEntity } from '../farms/entities/farm.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';

@Injectable()
export class CarePlansService {
  private readonly logger = new Logger(CarePlansService.name);

  constructor(
    @InjectRepository(FarmEntity)
    private readonly farmRepo: Repository<FarmEntity>,
    @InjectRepository(StandardEntity)
    private readonly standardRepo: Repository<StandardEntity>,
    @InjectRepository(StandardStepEntity)
    private readonly stepRepo: Repository<StandardStepEntity>,
    @InjectRepository(CareLogEntity)
    private readonly careLogRepo: Repository<CareLogEntity>,
  ) {}

  async getTodayPlan(
    farmId: string,
    userId: string,
  ): Promise<CarePlanResponseDto> {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Vườn không tồn tại');

    if (farm.ownerId !== userId) {
      // TODO: trader có hợp đồng active cũng được phép truy cập — Phase sau
      throw new ForbiddenException('Bạn không có quyền xem kế hoạch của vườn này');
    }

    if (!farm.standardId || !farm.plantingDate) {
      return {
        farmId,
        plantingDate: farm.plantingDate ?? undefined,
        cycleDay: undefined,
        tasks: [],
      };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const planting = new Date(farm.plantingDate);
    planting.setUTCHours(0, 0, 0, 0);

    const diffMs = today.getTime() - planting.getTime();
    const cycleDay = Math.floor(diffMs / 86_400_000) + 1;

    const standard = await this.standardRepo.findOne({
      where: { id: farm.standardId },
    });

    if (!standard) {
      this.logger.warn(`Standard ${farm.standardId} không tìm thấy cho farm ${farmId}`);
      return { farmId, plantingDate: farm.plantingDate, cycleDay, tasks: [] };
    }

    const steps = await this.stepRepo.find({
      where: { standardId: farm.standardId },
      order: { order: 'ASC' },
    });

    if (steps.length === 0) {
      return { farmId, plantingDate: farm.plantingDate, cycleDay, tasks: [] };
    }

    // Tính expectedDay tích lũy cho từng bước
    const stepsWithDay = this.computeExpectedDays(steps);

    // Chỉ lấy các bước có expectedDay <= cycleDay (đến hôm nay hoặc trước)
    const dueSteps = stepsWithDay.filter((s) => s.expectedDay <= cycleDay);

    if (dueSteps.length === 0) {
      return { farmId, plantingDate: farm.plantingDate, cycleDay, tasks: [] };
    }

    const dueStepIds = dueSteps.map((s) => s.step.id);

    // Lấy tất cả care_log của farm có standardStepId trong danh sách bước đến hạn
    const logs = await this.careLogRepo.find({
      where: { farmId, standardStepId: In(dueStepIds) },
      order: { performedAt: 'ASC' },
    });

    // Map stepId → log sớm nhất
    const logByStepId = new Map<string, CareLogEntity>();
    for (const log of logs) {
      if (log.standardStepId && !logByStepId.has(log.standardStepId)) {
        logByStepId.set(log.standardStepId, log);
      }
    }

    const plantingDateStr = farm.plantingDate;

    const tasks: DailyTaskDto[] = dueSteps.map(({ step, expectedDay }) => {
      const log = logByStepId.get(step.id);
      const dueDate = this.addDays(plantingDateStr, expectedDay - 1);

      return {
        id: `${farmId}:${step.id}`,
        farmId,
        standardStepId: step.id,
        title: step.title,
        description: step.description,
        expectedDay,
        dueDate,
        completed: !!log,
        completedAt: log ? log.performedAt.toISOString() : undefined,
        acceptanceCriteria: step.acceptanceCriteria ?? undefined,
      };
    });

    return {
      farmId,
      plantingDate: farm.plantingDate,
      cycleDay,
      tasks,
    };
  }

  async completeTask(
    farmId: string,
    standardStepId: string,
    userId: string,
  ): Promise<CompleteTaskResponseDto> {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Vườn không tồn tại');

    if (farm.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên vườn này');
    }

    const step = await this.stepRepo.findOne({ where: { id: standardStepId } });
    if (!step) throw new NotFoundException('Bước quy trình không tồn tại');

    const log = this.careLogRepo.create({
      farmId,
      standardStepId,
      action: 'process_step_complete',
      notes: 'Đánh dấu hoàn thành từ care plan',
      performedAt: new Date(),
      deviation: false,
      syncStatus: 'synced',
      clientRecordId: null,
      performedBy: userId,
    });

    const saved = await this.careLogRepo.save(log);

    this.logger.log({
      action: 'care_plan_task_complete',
      farmId,
      standardStepId,
      careLogId: saved.id,
      userId,
    });

    return { success: true, careLogId: saved.id };
  }

  /** Tính expectedDay tích lũy (1-based) cho từng bước theo thứ tự */
  private computeExpectedDays(
    steps: StandardStepEntity[],
  ): Array<{ step: StandardStepEntity; expectedDay: number }> {
    const result: Array<{ step: StandardStepEntity; expectedDay: number }> = [];
    let cumulative = 1;

    for (const step of steps) {
      result.push({ step, expectedDay: cumulative });
      cumulative += step.expectedDurationDays ?? 1;
    }

    return result;
  }

  /** Cộng N ngày vào ISO date string 'YYYY-MM-DD' */
  private addDays(isoDate: string, days: number): string {
    const d = new Date(isoDate);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
