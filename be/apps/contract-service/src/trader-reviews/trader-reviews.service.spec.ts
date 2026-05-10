import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TraderReviewsService } from './trader-reviews.service';
import { TraderReviewEntity } from './entities/trader-review.entity';
import { OrderEntity } from '../orders/entities/order.entity';

const mockReviewRepo = () =>
  ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<Repository<TraderReviewEntity>>;

const mockOrderRepo = () =>
  ({
    findOne: jest.fn(),
  }) as unknown as jest.Mocked<Repository<OrderEntity>>;

const mockDataSource = () =>
  ({
    query: jest.fn(),
  }) as unknown as jest.Mocked<DataSource>;

function makeService() {
  const reviewRepo = mockReviewRepo();
  const orderRepo = mockOrderRepo();
  const dataSource = mockDataSource();
  const service = new TraderReviewsService(reviewRepo, orderRepo, dataSource);
  return { service, reviewRepo, orderRepo, dataSource };
}

const BUYER_ID = 'buyer-uuid-001';
const TRADER_ID = 'trader-uuid-001';
const ORDER_ID = 'order-uuid-001';

function completedOrder(overrides?: Partial<OrderEntity>): OrderEntity {
  return {
    id: ORDER_ID,
    buyerId: BUYER_ID,
    traderId: TRADER_ID,
    status: 'completed',
    ...overrides,
  } as OrderEntity;
}

describe('TraderReviewsService', () => {
  describe('createReview', () => {
    it('should create review when order is completed and no duplicate', async () => {
      const { service, reviewRepo, orderRepo } = makeService();
      const order = completedOrder();
      orderRepo.findOne.mockResolvedValue(order);
      reviewRepo.findOne.mockResolvedValue(null);
      const entity = {
        id: 'rev-001',
        traderId: TRADER_ID,
        buyerId: BUYER_ID,
        orderId: ORDER_ID,
        rating: 4,
        comment: 'Good',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as TraderReviewEntity;
      reviewRepo.create.mockReturnValue(entity);
      reviewRepo.save.mockResolvedValue(entity);

      const result = await service.createReview(BUYER_ID, TRADER_ID, {
        orderId: ORDER_ID,
        rating: 4,
        comment: 'Good',
      });

      expect(result.rating).toBe(4);
      expect(result.traderId).toBe(TRADER_ID);
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const { service, orderRepo } = makeService();
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(BUYER_ID, TRADER_ID, { orderId: ORDER_ID, rating: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when order is not completed', async () => {
      const { service, orderRepo } = makeService();
      orderRepo.findOne.mockResolvedValue(completedOrder({ status: 'accepted' }));

      await expect(
        service.createReview(BUYER_ID, TRADER_ID, { orderId: ORDER_ID, rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException when buyer does not own the order', async () => {
      const { service, orderRepo } = makeService();
      orderRepo.findOne.mockResolvedValue(completedOrder({ buyerId: 'other-buyer' }));

      await expect(
        service.createReview(BUYER_ID, TRADER_ID, { orderId: ORDER_ID, rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ConflictException when review already exists for the same order', async () => {
      const { service, reviewRepo, orderRepo } = makeService();
      orderRepo.findOne.mockResolvedValue(completedOrder());
      reviewRepo.findOne.mockResolvedValue({ id: 'existing' } as TraderReviewEntity);

      await expect(
        service.createReview(BUYER_ID, TRADER_ID, { orderId: ORDER_ID, rating: 3 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getTrustScore', () => {
    it('should return null average when there are no reviews', async () => {
      const { service, dataSource } = makeService();
      dataSource.query.mockResolvedValue([{ avg: null, count: '0' }]);

      const result = await service.getTrustScore(TRADER_ID);

      expect(result.average).toBeNull();
      expect(result.count).toBe(0);
      expect(result.traderId).toBe(TRADER_ID);
    });

    it('should return correct average with 1 review', async () => {
      const { service, dataSource } = makeService();
      dataSource.query.mockResolvedValue([{ avg: '4', count: '1' }]);

      const result = await service.getTrustScore(TRADER_ID);

      expect(result.average).toBe(4.0);
      expect(result.count).toBe(1);
    });

    it('should round average to 1 decimal place for N reviews', async () => {
      const { service, dataSource } = makeService();
      // AVG of [3, 4, 5] = 4.0
      dataSource.query.mockResolvedValue([{ avg: '4.3333', count: '3' }]);

      const result = await service.getTrustScore(TRADER_ID);

      expect(result.average).toBe(4.3);
      expect(result.count).toBe(3);
    });
  });

  describe('updateReview', () => {
    it('should throw ForbiddenException when updating after 7 days', async () => {
      const { service, reviewRepo } = makeService();
      const old = new Date();
      old.setDate(old.getDate() - 8);
      reviewRepo.findOne.mockResolvedValue({
        id: 'rev-001',
        buyerId: BUYER_ID,
        createdAt: old,
        rating: 3,
        comment: null,
        deletedAt: null,
      } as TraderReviewEntity);

      await expect(
        service.updateReview('rev-001', BUYER_ID, { rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException when non-owner tries to update', async () => {
      const { service, reviewRepo } = makeService();
      reviewRepo.findOne.mockResolvedValue({
        id: 'rev-001',
        buyerId: 'other-buyer',
        createdAt: new Date(),
      } as TraderReviewEntity);

      await expect(
        service.updateReview('rev-001', BUYER_ID, { rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deleteReview (soft delete)', () => {
    it('should soft delete review so it is excluded from AVG', async () => {
      const { service, reviewRepo } = makeService();
      const entity = {
        id: 'rev-001',
        buyerId: BUYER_ID,
        deletedAt: null,
      } as TraderReviewEntity;
      reviewRepo.findOne.mockResolvedValue(entity);
      reviewRepo.save.mockResolvedValue({ ...entity, deletedAt: new Date() } as TraderReviewEntity);

      await service.deleteReview('rev-001', BUYER_ID);

      expect(reviewRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });
});
