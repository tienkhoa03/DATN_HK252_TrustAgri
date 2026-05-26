import { ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CareLogsService } from './care-logs.service';
import { CareLogEntity } from './entities/care-log.entity';
import { EvidenceEntity } from './entities/evidence.entity';
import { CareAuditLogEntity } from './entities/care-audit-log.entity';
import { FarmEntity } from '../farms/entities/farm.entity';
import { StandardStepEntity } from '../standards/entities/standard-step.entity';
import { AuthClientService } from '../clients/auth-client.service';

function mockRepo<T>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  } as unknown as jest.Mocked<Repository<T>>;
}

function mockDataSource(): jest.Mocked<DataSource> {
  const qr = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: { save: jest.fn().mockImplementation((_, e) => Promise.resolve(e)) },
  };
  return {
    createQueryRunner: jest.fn().mockReturnValue(qr),
  } as unknown as jest.Mocked<DataSource>;
}

function mockAuthClient(): AuthClientService {
  return { getUserSnapshot: jest.fn().mockResolvedValue(null) } as unknown as AuthClientService;
}

function buildService() {
  const careLogRepo = mockRepo<CareLogEntity>();
  const evidenceRepo = mockRepo<EvidenceEntity>();
  const auditRepo = mockRepo<CareAuditLogEntity>();
  const farmRepo = mockRepo<FarmEntity>();
  const stepRepo = mockRepo<StandardStepEntity>();
  const authClient = mockAuthClient();
  const dataSource = mockDataSource();

  const svc = new CareLogsService(
    careLogRepo,
    evidenceRepo,
    auditRepo,
    farmRepo,
    stepRepo,
    authClient,
    dataSource,
  );

  return { svc, careLogRepo, farmRepo, auditRepo, dataSource };
}

describe('CareLogsService.updateCareLog — immutable field guard', () => {
  it('throws ConflictException when attempting to update action', async () => {
    const { svc, careLogRepo, farmRepo } = buildService();

    farmRepo.findOne.mockResolvedValue({ id: 'farm-1', ownerId: 'user-1' } as FarmEntity);
    careLogRepo.findOne.mockResolvedValue({
      id: 'log-1',
      farmId: 'farm-1',
      notes: null,
      evidences: [],
      standardStep: null,
    } as unknown as CareLogEntity);

    await expect(
      svc.updateCareLog('farm-1', 'log-1', { notes: 'ok', ...(({ action: 'spraying' } as unknown) as { notes?: string }) }, 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows updating notes and records audit UPDATE', async () => {
    const { svc, careLogRepo, farmRepo, auditRepo, dataSource } = buildService();

    farmRepo.findOne.mockResolvedValue({ id: 'farm-1', ownerId: 'user-1' } as FarmEntity);
    const existingLog = {
      id: 'log-1',
      farmId: 'farm-1',
      notes: 'old note',
      evidences: [],
      standardStep: null,
      action: 'watering',
      performedAt: new Date('2026-01-10T08:00:00Z'),
      deviation: false,
      syncStatus: 'synced',
      contractId: null,
      performedBy: null,
      performedByName: null,
      performedByPhone: null,
      standardStepId: null,
      clientRecordId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as CareLogEntity;
    careLogRepo.findOne
      .mockResolvedValueOnce(existingLog) // first call (updateCareLog)
      .mockResolvedValueOnce({ ...existingLog, notes: 'new note' }); // findOne after save

    const qr = (dataSource.createQueryRunner as jest.Mock)();

    await svc.updateCareLog('farm-1', 'log-1', { notes: 'new note' }, 'user-1');

    expect(qr.manager.save).toHaveBeenCalledTimes(2); // once for log, once for audit
    const auditCall = qr.manager.save.mock.calls[1];
    expect(auditCall[1]).toMatchObject({ action: 'UPDATE', changedBy: 'user-1' });
  });
});

describe('CareLogsService audit — CREATE hook records audit', () => {
  it('saves audit record with action=CREATE when createCareLog is called', async () => {
    const { svc, careLogRepo, farmRepo, auditRepo } = buildService();

    farmRepo.findOne.mockResolvedValue({ id: 'farm-1', ownerId: 'user-1', standardId: null, currentContractId: null } as FarmEntity);

    const savedLog = { id: 'log-new', farmId: 'farm-1', action: 'watering', performedAt: new Date(), evidences: [] };
    careLogRepo.create = jest.fn().mockReturnValue(savedLog);
    careLogRepo.save.mockResolvedValue(savedLog as unknown as CareLogEntity);
    careLogRepo.findOne.mockResolvedValue({ ...savedLog, evidences: [], standardStep: null } as unknown as CareLogEntity);
    auditRepo.create = jest.fn().mockImplementation((x) => x);
    auditRepo.save.mockResolvedValue({} as CareAuditLogEntity);

    await svc.createCareLog('farm-1', { action: 'watering', performedAt: new Date().toISOString() }, 'user-1');

    expect(auditRepo.save).toHaveBeenCalledTimes(1);
    const auditArg = (auditRepo.save as jest.Mock).mock.calls[0][0];
    expect(auditArg).toMatchObject({ careLogId: 'log-new', action: 'CREATE', changedBy: 'user-1' });
  });
});
