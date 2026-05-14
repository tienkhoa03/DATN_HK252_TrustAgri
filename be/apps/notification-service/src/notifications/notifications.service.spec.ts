import { Repository } from 'typeorm';
import type { AlertDto, ConnectionDto } from '@trustagri/shared';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './notification.entity';
import { ZnsAdapterService } from './services/zns-adapter.service';
import { FarmLookupService } from './services/farm-lookup.service';

function mockRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn((row: Partial<NotificationEntity>) => row as NotificationEntity),
    save: jest.fn(async (row: NotificationEntity) => ({
      ...row,
      id: 'notif-1',
      createdAt: new Date(),
    })),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<NotificationEntity>>;
}

function mockZns() {
  return {
    sendNotification: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ZnsAdapterService>;
}

function mockFarmLookup() {
  return {
    getOwnerIdByFarmId: jest.fn(),
  } as unknown as jest.Mocked<FarmLookupService>;
}

function makeService() {
  const repo = mockRepo();
  const zns = mockZns();
  const farmLookup = mockFarmLookup();
  const svc = new NotificationsService(repo, zns, farmLookup);
  return { svc, repo, zns, farmLookup };
}

const sampleAlert: AlertDto = {
  id: 'alert-1',
  farmId: 'farm-9',
  sensorType: 'temperature',
  severity: 'danger',
  threshold: 40,
  value: 42,
  suggestedAction: 'Tưới nước',
  acknowledged: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationsService', () => {
  describe('handleAlertCreated', () => {
    it('does nothing when farm owner cannot be resolved', async () => {
      const { svc, repo, farmLookup } = makeService();
      farmLookup.getOwnerIdByFarmId.mockResolvedValue(null);

      await svc.handleAlertCreated(sampleAlert);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('persists notification and schedules ZNS delivery', async () => {
      const { svc, repo, zns, farmLookup } = makeService();
      farmLookup.getOwnerIdByFarmId.mockResolvedValue('owner-z');

      await svc.handleAlertCreated(sampleAlert);
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner-z',
          type: 'alert',
          title: 'Cảnh báo cảm biến',
          read: false,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(zns.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner-z',
          title: 'Cảnh báo cảm biến',
        }),
      );
    });
  });

  describe('handleConnectionRequested', () => {
    it('notifies recipient (toUserId)', async () => {
      const { svc, repo, zns } = makeService();
      const conn = {
        id: 'c-1',
        toUserId: 'trader-receiver',
        fromUserId: 'farmer-sender',
        fromRole: 'farmer',
        toRole: 'trader',
        status: 'pending',
        message: 'Xin kết nối',
        createdAt: new Date().toISOString(),
      } as ConnectionDto;

      await svc.handleConnectionRequested(conn);
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'trader-receiver',
          type: 'connection',
        }),
      );
      expect(zns.sendNotification).toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    it('throws when notification missing', async () => {
      const { svc, repo } = makeService();
      repo.findOne = jest.fn().mockResolvedValue(null);

      await expect(svc.markRead('user-1', 'missing')).rejects.toThrow('Thông báo không tồn tại');
    });

    it('throws when notification belongs to another user', async () => {
      const { svc, repo } = makeService();
      repo.findOne = jest.fn().mockResolvedValue({
        id: 'n1',
        userId: 'other',
        read: false,
      } as NotificationEntity);

      await expect(svc.markRead('user-1', 'n1')).rejects.toThrow('Thông báo không tồn tại');
    });
  });
});
