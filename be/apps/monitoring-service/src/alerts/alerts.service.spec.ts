import { Repository } from 'typeorm';
import { AlertsService } from './alerts.service';
import { AlertEntity } from './alert.entity';
import { AlertPublisherService } from './services/alert-publisher.service';
import { FarmClientService } from '../clients/farm-client.service';
import { AuthClientService } from '../clients/auth-client.service';
import type { SensorReadingDto } from '@trustagri/shared';

function mockRepo() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((x: Partial<AlertEntity>) => x as AlertEntity),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<AlertEntity>>;
}

function mockPublisher() {
  return {
    publishAlertCreated: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Pick<AlertPublisherService, 'publishAlertCreated'>>;
}

function mockFarmClient() {
  return {
    getFarmSnapshot: jest.fn().mockResolvedValue(null),
    getFarmName: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<FarmClientService>;
}

function mockAuthClient() {
  return {
    getUserSnapshot: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<AuthClientService>;
}

function reading(overrides: Partial<SensorReadingDto>): SensorReadingDto {
  return {
    farmId: 'farm-1',
    sensorType: 'temperature',
    value: 0,
    recordedAt: new Date().toISOString(),
    ...overrides,
  } as SensorReadingDto;
}

describe('AlertsService', () => {
  describe('checkAndCreateAlert', () => {
    it('no-op when sensor type has no threshold config', async () => {
      const alertRepo = mockRepo();
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      await svc.checkAndCreateAlert({
        ...reading({ sensorType: 'temperature' }),
        sensorType: 'unknown_sensor',
      } as unknown as SensorReadingDto);

      expect(alertRepo.findOne).not.toHaveBeenCalled();
      expect(alertRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishAlertCreated).not.toHaveBeenCalled();
    });

    it('no-op when value inside safe band', async () => {
      const alertRepo = mockRepo();
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      await svc.checkAndCreateAlert(reading({ sensorType: 'temperature', value: 22 }));

      expect(alertRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishAlertCreated).not.toHaveBeenCalled();
    });

    it('creates danger alert when value exceeds danger max', async () => {
      const alertRepo = mockRepo();
      alertRepo.findOne.mockResolvedValue(null);
      alertRepo.save.mockImplementation(async (e: AlertEntity) => ({
        ...e,
        id: 'alert-1',
        createdAt: new Date(),
      }));
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      await svc.checkAndCreateAlert(reading({ sensorType: 'temperature', value: 41 }));

      expect(alertRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          farmId: 'farm-1',
          sensorType: 'temperature',
          severity: 'danger',
          threshold: 40,
          value: 41,
          acknowledged: false,
        }),
      );
      expect(publisher.publishAlertCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alert-1', severity: 'danger' }),
      );
    });

    it('deduplicates when unacknowledged alert already exists', async () => {
      const alertRepo = mockRepo();
      alertRepo.findOne.mockResolvedValue({ id: 'existing' } as AlertEntity);
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      await svc.checkAndCreateAlert(reading({ sensorType: 'humidity', value: 95 }));

      expect(alertRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishAlertCreated).not.toHaveBeenCalled();
    });
  });

  describe('acknowledgeAlert', () => {
    it('throws when alert missing', async () => {
      const alertRepo = mockRepo();
      alertRepo.findOne.mockResolvedValue(null);
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      await expect(svc.acknowledgeAlert('missing', 'user-1')).rejects.toThrow('Cảnh báo không tồn tại');
    });

    it('marks alert acknowledged', async () => {
      const alertRepo = mockRepo();
      const entity = {
        id: 'a1',
        farmId: 'f1',
        acknowledged: false,
      } as AlertEntity;
      alertRepo.findOne.mockResolvedValue(entity);
      alertRepo.save.mockImplementation(async (e: AlertEntity) => e);
      const publisher = mockPublisher();
      const svc = new AlertsService(
        alertRepo,
        publisher as unknown as AlertPublisherService,
        mockFarmClient(),
        mockAuthClient(),
      );

      const res = await svc.acknowledgeAlert('a1', 'user-1');

      expect(res).toEqual({ success: true });
      expect(alertRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          acknowledged: true,
          acknowledgedBy: 'user-1',
          acknowledgedAt: expect.any(Date),
        }),
      );
    });
  });
});
