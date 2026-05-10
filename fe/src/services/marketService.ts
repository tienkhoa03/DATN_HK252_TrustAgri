/**
 * Market data service — FR-F02 (Thông tin thị trường)
 * Gọi GET /api/v1/markets/forecasts và /api/v1/markets/news.
 * Khi BE chưa có endpoint, service throw lỗi → screen render empty-state.
 */

import apiClient from '@/api/client';

export interface PriceForecastPoint {
  date: string;
  price: number;
  isActual: boolean;
}

export interface PriceForecastDto {
  cropType: string;
  unit: string;
  points: PriceForecastPoint[];
}

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source?: string;
}

export async function fetchPriceForecast(
  cropType: string,
  days = 7,
): Promise<PriceForecastDto> {
  const res = await apiClient.get<PriceForecastDto>(
    `/markets/forecasts?cropType=${encodeURIComponent(cropType)}&days=${days}`,
  );
  return res.data;
}

export async function fetchMarketNews(
  cropType: string,
  limit = 5,
): Promise<MarketNewsItem[]> {
  const res = await apiClient.get<{ items: MarketNewsItem[] }>(
    `/markets/news?cropType=${encodeURIComponent(cropType)}&limit=${limit}`,
  );
  return res.data.items;
}
