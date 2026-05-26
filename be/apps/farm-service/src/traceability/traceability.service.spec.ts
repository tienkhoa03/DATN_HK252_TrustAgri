import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { TraceabilityService } from './traceability.service';
import { FarmEntity } from '../farms/entities/farm.entity';
import { CareLogEntity } from '../care-logs/entities/care-log.entity';
import { CareAuditLogEntity } from '../care-logs/entities/care-audit-log.entity';
import { StandardEntity } from '../standards/entities/standard.entity';
import * as internalClients from './internal-clients';

jest.mock('./internal-clients');

const mockedFetch = jest.spyOn(internalClients, 'fetchCurrentEnvironment');
const mockedCompliance = jest.spyOn(internalClients, 'fetchComplianceCertificateByContractId');

function mockRepo<T>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  } as unknown as jest.Mocked<Repository<T>>;
}

function mockConfig(overrides: Record<string, unknown> = {}): ConfigService {
  return {
    get: jest.fn((key: string) => overrides[key] ?? undefined),
  } as unknown as ConfigService;
}

const FARM_BASE: Partial<FarmEntity> = {
  id: 'farm-1',
  name: 'Vườn Test',
  cropType: 'rice',
  area: 2.5,
  plantingDate: '2026-01-01',
  ownerDisplayName: 'Nguyễn A',
  ownerPhone: null,
  ownerId: 'user-1',
  location: { province: 'An Giang', district: 'Long Xuyên', addressLine: '123 QL1' },
  traceabilityCode: 'TR-abc123',
  standardId: null,
  currentContractId: null,
};

function makeStep(order: number, expectedDurationDays: number | null) {
  return { id: `step-${order}`, order, title: `Bước ${order}`, expectedDurationDays, standardId: 'std-1' };
}

function makeCareLog(overrides: Partial<CareLogEntity> = {}): CareLogEntity {
  return {
    id: `log-${Math.random()}`,
    farmId: 'farm-1',
    action: 'watering',
    notes: null,
    performedAt: new Date('2026-01-10T08:00:00Z'),
    deviation: false,
    standardStepId: null,
    standardStep: null,
    evidences: [],
    syncStatus: 'synced',
    clientRecordId: null,
    performedBy: null,
    performedByName: null,
    performedByPhone: null,
    contractId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CareLogEntity;
}

function buildService(
  farmOverrides: Partial<FarmEntity> = {},
  logs: Partial<CareLogEntity>[] = [],
  standardSteps: ReturnType<typeof makeStep>[] = [],
  auditEdited: string[] = [],
) {
  const farmRepo = mockRepo<FarmEntity>();
  const careLogRepo = mockRepo<CareLogEntity>();
  const auditRepo = mockRepo<CareAuditLogEntity>();
  const standardRepo = mockRepo<StandardEntity>();
  const config = mockConfig();

  const farm = { ...FARM_BASE, ...farmOverrides } as FarmEntity;
  farmRepo.findOne.mockResolvedValue(farm);
  careLogRepo.find.mockResolvedValue(logs.map((l) => makeCareLog(l)));

  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(auditEdited.map((id) => ({ careLogId: id }))),
  };
  auditRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

  if (farmOverrides.standardId) {
    standardRepo.findOne.mockResolvedValue({
      id: farmOverrides.standardId,
      code: 'GAP-001',
      name: 'VietGAP',
      steps: standardSteps,
    } as unknown as StandardEntity);
  } else {
    standardRepo.findOne.mockResolvedValue(null);
  }

  const svc = new TraceabilityService(farmRepo, careLogRepo, auditRepo, standardRepo, config);
  return svc;
}

describe('TraceabilityService.getByQrCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockResolvedValue([]);
    mockedCompliance.mockResolvedValue(undefined);
    // Mock fetch for sensorChart
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 } as Response);
  });

  it('throws NotFoundException when farm not found', async () => {
    const farmRepo = mockRepo<FarmEntity>();
    farmRepo.findOne.mockResolvedValue(null);
    const svc = new TraceabilityService(
      farmRepo,
      mockRepo<CareLogEntity>(),
      mockRepo<CareAuditLogEntity>(),
      mockRepo<StandardEntity>(),
      mockConfig(),
    );
    await expect(svc.getByQrCode('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns full data: area, plantingDate, ownerDisplayName in farm identity', async () => {
    const svc = buildService({}, []);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.farm.area).toBe(2.5);
    expect(result.farm.plantingDate).toBe('2026-01-01');
    expect(result.farm.ownerDisplayName).toBe('Nguyễn A');
  });

  it('returns process=undefined when farm has no standard', async () => {
    const svc = buildService({ standardId: null }, []);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.process).toBeUndefined();
    expect(result.standard).toBeUndefined();
  });

  it('returns process summary when farm has standard with steps', async () => {
    const steps = [makeStep(1, 5), makeStep(2, 10)];
    const plantingMs = new Date('2026-01-01').getTime();
    const logs: Partial<CareLogEntity>[] = [
      {
        id: 'log-1',
        standardStepId: 'step-1',
        standardStep: { ...steps[0] } as never,
        performedAt: new Date(plantingMs + 4 * 86_400_000), // day 4 — not late (≤5+2)
        deviation: false,
      },
    ];
    const svc = buildService({ standardId: 'std-1', plantingDate: '2026-01-01' }, logs, steps);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.process).toBeDefined();
    expect(result.process!.totalSteps).toBe(2);
    expect(result.careLogTimeline[0].isLate).toBe(false);
  });

  it('marks careLog isLate=true when actualDayOffset exceeds expectedOffset + tolerance', async () => {
    const steps = [makeStep(1, 5)];
    const plantingMs = new Date('2026-01-01').getTime();
    const logs: Partial<CareLogEntity>[] = [
      {
        id: 'log-late',
        standardStepId: 'step-1',
        standardStep: { ...steps[0] } as never,
        performedAt: new Date(plantingMs + 8 * 86_400_000), // day 8 — late (8-5=3 > 2)
        deviation: false,
      },
    ];
    const svc = buildService({ standardId: 'std-1', plantingDate: '2026-01-01' }, logs, steps);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.careLogTimeline[0].isLate).toBe(true);
    expect(result.process!.lateCount).toBe(1);
  });

  it('marks isEdited=true for logs with audit UPDATE record', async () => {
    const logs: Partial<CareLogEntity>[] = [{ id: 'log-edit' }];
    const svc = buildService({}, logs, [], ['log-edit']);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.careLogTimeline[0].isEdited).toBe(true);
  });

  it('handles missing plantingDate — isLate stays false', async () => {
    const steps = [makeStep(1, 5)];
    const logs: Partial<CareLogEntity>[] = [
      {
        id: 'log-1',
        standardStepId: 'step-1',
        standardStep: { ...steps[0] } as never,
        performedAt: new Date('2026-01-10T08:00:00Z'),
        deviation: false,
      },
    ];
    const svc = buildService({ standardId: 'std-1', plantingDate: null }, logs, steps);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.careLogTimeline[0].isLate).toBe(false);
  });

  it('handles Redis miss (empty currentEnvironment) — does not crash', async () => {
    mockedFetch.mockResolvedValue([]);
    const svc = buildService({}, []);
    const result = await svc.getByQrCode('TR-abc123');

    expect(result.currentEnvironment).toEqual([]);
  });

  it('omits PII: response does not contain ownerPhone or ownerId', async () => {
    const svc = buildService({}, []);
    const result = await svc.getByQrCode('TR-abc123');
    const farmStr = JSON.stringify(result.farm);

    expect(farmStr).not.toContain('ownerPhone');
    expect(farmStr).not.toContain('ownerId');
  });
});
