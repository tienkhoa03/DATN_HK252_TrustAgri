import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  StandardDto,
  StandardStepDto,
  CreateStandardDto,
  UpdateStandardDto,
  ListResponse,
} from '@trustagri/shared';
import { StandardEntity } from './entities/standard.entity';
import { StandardStepEntity } from './entities/standard-step.entity';
import { ListStandardsQueryDto } from './dto/list-standards-query.dto';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class StandardsService {
  private readonly logger = new Logger(StandardsService.name);

  constructor(
    @InjectRepository(StandardEntity)
    private readonly standardRepo: Repository<StandardEntity>,
    @InjectRepository(StandardStepEntity)
    private readonly stepRepo: Repository<StandardStepEntity>,
    private readonly authClient: AuthClientService,
  ) {}

  async list(query: ListStandardsQueryDto): Promise<ListResponse<StandardDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.standardRepo
      .createQueryBuilder('std')
      .leftJoinAndSelect('std.steps', 'step')
      .orderBy('std.createdAt', 'DESC')
      .addOrderBy('step.order', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.ownerTraderId !== undefined) {
      if (query.ownerTraderId === 'null' || query.ownerTraderId === '') {
        qb.andWhere('std.owner_trader_id IS NULL');
      } else {
        qb.andWhere('std.ownerTraderId = :ownerId', {
          ownerId: query.ownerTraderId,
        });
      }
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  async findOne(id: string): Promise<StandardDto> {
    const standard = await this.standardRepo.findOne({
      where: { id },
      relations: ['steps'],
      order: { steps: { order: 'ASC' } },
    });
    if (!standard) {
      throw new NotFoundException('Tiêu chuẩn không tồn tại');
    }
    return this.toDto(standard);
  }

  async create(dto: CreateStandardDto, traderId: string): Promise<StandardDto> {
    const existing = await this.standardRepo.findOne({
      where: { code: dto.code },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`Mã tiêu chuẩn '${dto.code}' đã tồn tại`);
    }

    const [ownerTraderSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(traderId),
    ]);
    const ownerTraderSnap = settledValue(ownerTraderSnapRes);

    const standard = this.standardRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      cropType: dto.cropType ?? null,
      ownerTraderId: traderId,
      ownerTraderName: ownerTraderSnap?.displayName ?? null,
      ownerTraderPhone: ownerTraderSnap?.phone ?? null,
    });
    const saved = await this.standardRepo.save(standard);

    if (dto.steps && dto.steps.length > 0) {
      const stepEntities = dto.steps.map((s) =>
        this.stepRepo.create({
          standardId: saved.id,
          order: s.order,
          title: s.title,
          description: s.description,
          expectedDurationDays: s.expectedDurationDays ?? null,
          acceptanceCriteria: s.acceptanceCriteria ?? null,
        }),
      );
      await this.stepRepo.save(stepEntities);
    }

    return this.findOne(saved.id);
  }

  async update(
    id: string,
    dto: UpdateStandardDto,
    requesterId: string,
  ): Promise<StandardDto> {
    const standard = await this.standardRepo.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!standard) {
      throw new NotFoundException('Tiêu chuẩn không tồn tại');
    }

    if (standard.ownerTraderId === null) {
      throw new ForbiddenException(
        'Không thể chỉnh sửa tiêu chuẩn hệ thống',
      );
    }
    if (standard.ownerTraderId !== requesterId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật tiêu chuẩn này',
      );
    }

    if (dto.name !== undefined) standard.name = dto.name;
    if (dto.description !== undefined) standard.description = dto.description;
    if (dto.cropType !== undefined) standard.cropType = dto.cropType ?? null;
    standard.version += 1;

    await this.standardRepo.save(standard);

    if (dto.steps !== undefined) {
      await this.stepRepo.delete({ standardId: id });

      if (dto.steps.length > 0) {
        const stepEntities = dto.steps.map((s) =>
          this.stepRepo.create({
            standardId: id,
            order: s.order,
            title: s.title,
            description: s.description,
            expectedDurationDays: s.expectedDurationDays ?? null,
            acceptanceCriteria: s.acceptanceCriteria ?? null,
          }),
        );
        await this.stepRepo.save(stepEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const standard = await this.standardRepo.findOne({ where: { id } });
    if (!standard) {
      throw new NotFoundException('Tiêu chuẩn không tồn tại');
    }

    if (standard.ownerTraderId === null) {
      throw new ForbiddenException(
        'Không thể xóa tiêu chuẩn hệ thống',
      );
    }
    if (standard.ownerTraderId !== requesterId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa tiêu chuẩn này',
      );
    }

    await this.standardRepo.softRemove(standard);
    this.logger.log(`Standard ${id} soft-deleted by trader ${requesterId}`);
  }

  private toDto(standard: StandardEntity): StandardDto {
    const steps: StandardStepDto[] = (standard.steps ?? [])
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        description: s.description,
        expectedDurationDays: s.expectedDurationDays ?? undefined,
        acceptanceCriteria: s.acceptanceCriteria ?? undefined,
      }));

    return {
      id: standard.id,
      code: standard.code,
      name: standard.name,
      description: standard.description,
      cropType: standard.cropType ?? undefined,
      version: standard.version,
      ownerTraderId: standard.ownerTraderId ?? undefined,
      ownerTraderName: standard.ownerTraderName ?? null,
      ownerTraderPhone: standard.ownerTraderPhone ?? null,
      steps,
      createdAt: standard.createdAt.toISOString(),
      updatedAt: standard.updatedAt.toISOString(),
    };
  }
}
