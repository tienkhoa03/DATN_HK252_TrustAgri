import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StandardsService } from './standards.service';
import { StandardEntity } from './entities/standard.entity';
import { StandardStepEntity } from './entities/standard-step.entity';
import { AuthClientService } from '../clients/auth-client.service';

function mockStandardRepo() {
  return {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  } as unknown as jest.Mocked<Repository<StandardEntity>>;
}

function mockStepRepo() {
  return {
    delete: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<StandardStepEntity>>;
}

function mockAuthClient() {
  return {
    getUserSnapshot: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<AuthClientService>;
}

describe('StandardsService', () => {
  describe('findOne', () => {
    it('throws NotFoundException when standard does not exist', async () => {
      const standardRepo = mockStandardRepo();
      standardRepo.findOne.mockResolvedValue(null);
      const stepRepo = mockStepRepo();
      const svc = new StandardsService(standardRepo, stepRepo, mockAuthClient());

      await expect(svc.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns StandardDto with ordered steps', async () => {
      const standardRepo = mockStandardRepo();
      const created = new Date('2026-05-01T10:00:00Z');
      const updated = new Date('2026-05-02T10:00:00Z');
      const entity = {
        id: 'std-1',
        code: 'GAP-001',
        name: 'Chuẩn GAP',
        description: 'Mô tả',
        cropType: 'cà phê',
        version: 1,
        ownerTraderId: 'trader-1',
        createdAt: created,
        updatedAt: updated,
        steps: [
          {
            id: 's2',
            standardId: 'std-1',
            order: 2,
            title: 'Bước 2',
            description: 'd2',
            expectedDurationDays: null,
            acceptanceCriteria: null,
          },
          {
            id: 's1',
            standardId: 'std-1',
            order: 1,
            title: 'Bước 1',
            description: 'd1',
            expectedDurationDays: 3,
            acceptanceCriteria: 'ok',
          },
        ],
      } as StandardEntity;
      standardRepo.findOne.mockResolvedValue(entity);
      const stepRepo = mockStepRepo();
      const svc = new StandardsService(standardRepo, stepRepo, mockAuthClient());

      const dto = await svc.findOne('std-1');

      expect(dto.id).toBe('std-1');
      expect(dto.code).toBe('GAP-001');
      expect(dto.steps.map((s) => s.order)).toEqual([1, 2]);
      expect(dto.steps[0].title).toBe('Bước 1');
      expect(dto.steps[0].expectedDurationDays).toBe(3);
    });
  });
});
