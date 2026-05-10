/**
 * Unit tests for marketService
 * Verifies API call shapes for /markets/forecasts and /markets/news endpoints.
 */

import apiClient from '@/api/client';
import { fetchPriceForecast, fetchMarketNews } from '@/services/marketService';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedApi = apiClient as jest.Mocked<typeof apiClient>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchPriceForecast', () => {
  it('should call GET /api/v1/markets/forecasts with cropType and days', async () => {
    const mockForecast = {
      cropType: 'durian',
      unit: 'kg',
      points: [{ date: '2026-05-10', price: 120000, isActual: true }],
    };
    (mockedApi.get as jest.Mock).mockResolvedValue({ data: mockForecast });

    const result = await fetchPriceForecast('durian', 7);

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/markets/forecasts?cropType=durian&days=7',
    );
    expect(result.cropType).toBe('durian');
    expect(result.points).toHaveLength(1);
  });

  it('should URL-encode special chars in cropType', async () => {
    (mockedApi.get as jest.Mock).mockResolvedValue({
      data: { cropType: 'sầu riêng', unit: 'kg', points: [] },
    });

    await fetchPriceForecast('sầu riêng', 7);

    const calledUrl = (mockedApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent('sầu riêng'));
  });

  it('should propagate errors from the API', async () => {
    (mockedApi.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(fetchPriceForecast('durian', 7)).rejects.toThrow('Network error');
  });
});

describe('fetchMarketNews', () => {
  it('should call GET /api/v1/markets/news and return items array', async () => {
    const mockNews = {
      items: [
        {
          id: 'news-1',
          title: 'Giá sầu riêng tăng',
          summary: 'Nhu cầu xuất khẩu tăng...',
          publishedAt: '2026-05-10T08:00:00.000Z',
        },
      ],
    };
    (mockedApi.get as jest.Mock).mockResolvedValue({ data: mockNews });

    const result = await fetchMarketNews('durian', 5);

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/markets/news?cropType=durian&limit=5',
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('news-1');
  });
});
