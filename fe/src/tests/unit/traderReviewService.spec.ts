/**
 * Unit tests for traderReviewService
 */

import apiClient from '@/api/client';
import {
  getTrustScore,
  createTraderReview,
  listTraderReviews,
  type TrustScoreDto,
  type TraderReviewDto,
} from '@/services/traderReviewService';
import { ApiError } from '@/api/errors';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

const TRADER_ID = 'trader-abc-123';
const REVIEW_ID = 'review-def-456';

const mockTrustScore: TrustScoreDto = {
  traderId: TRADER_ID,
  average: 4.2,
  count: 17,
};

const mockReview: TraderReviewDto = {
  id: REVIEW_ID,
  traderId: TRADER_ID,
  buyerId: 'buyer-xyz',
  buyerDisplayName: 'Nguyễn Văn A',
  orderId: 'order-001',
  rating: 5,
  comment: 'Thương lái uy tín',
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-01T10:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTrustScore', () => {
  it('should return parsed TrustScoreDto when API call succeeds', async () => {
    (mockedClient.get as jest.Mock).mockResolvedValue({ data: mockTrustScore });

    const result = await getTrustScore(TRADER_ID);

    expect(mockedClient.get).toHaveBeenCalledWith(
      `/traders/${TRADER_ID}/trust-score`,
    );
    expect(result).toEqual(mockTrustScore);
    expect(result.average).toBe(4.2);
    expect(result.count).toBe(17);
  });

  it('should re-throw when API returns an error', async () => {
    const apiError = new ApiError('NOT_FOUND', 'Trader not found', 404);
    (mockedClient.get as jest.Mock).mockRejectedValue(apiError);

    await expect(getTrustScore(TRADER_ID)).rejects.toThrow(ApiError);
    await expect(getTrustScore(TRADER_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('createTraderReview', () => {
  it('should call POST with correct URL and body', async () => {
    (mockedClient.post as jest.Mock).mockResolvedValue({ data: mockReview });

    const body = { orderId: 'order-001', rating: 5, comment: 'Thương lái uy tín' };
    const result = await createTraderReview(TRADER_ID, body);

    expect(mockedClient.post).toHaveBeenCalledWith(
      `/traders/${TRADER_ID}/reviews`,
      body,
    );
    expect(result.id).toBe(REVIEW_ID);
    expect(result.rating).toBe(5);
  });

  it('should re-throw when API returns an error', async () => {
    const apiError = new ApiError('CONFLICT', 'Already reviewed', 409);
    (mockedClient.post as jest.Mock).mockRejectedValue(apiError);

    await expect(
      createTraderReview(TRADER_ID, { orderId: 'order-001', rating: 4 }),
    ).rejects.toThrow(ApiError);
  });
});

describe('listTraderReviews', () => {
  it('should call GET with correct URL and query params', async () => {
    const mockList = { items: [mockReview], page: 1, limit: 10, total: 1 };
    (mockedClient.get as jest.Mock).mockResolvedValue({ data: mockList });

    const result = await listTraderReviews(TRADER_ID, 1, 10);

    expect(mockedClient.get).toHaveBeenCalledWith(
      `/traders/${TRADER_ID}/reviews`,
      { params: { page: 1, limit: 10 } },
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
