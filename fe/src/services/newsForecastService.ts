/**
 * newsForecastService — gọi thực tế Notification Service (news, forecasts) qua API Gateway.
 *
 * Endpoints (specs/backend-api-specification/design.md §4.2):
 *   GET    /api/v1/news              → ListResponse<NewsArticleDto>   (public)
 *   GET    /api/v1/news/:id        → NewsArticleDto                  (public)
 *   POST   /api/v1/news            → NewsArticleDto                  (trader)
 *   PUT    /api/v1/news/:id      → NewsArticleDto                  (trader)
 *   GET    /api/v1/forecasts       → ListResponse<ForecastDto>       (public)
 *   GET    /api/v1/forecasts/:id   → ForecastDto                     (public)
 *   POST   /api/v1/forecasts       → ForecastDto                     (trader)
 *   PUT    /api/v1/forecasts/:id   → ForecastDto                     (trader)
 *
 * GET công khai không cần Bearer; interceptor chỉ gắn header khi đã có token.
 * POST/PUT yêu cầu role trader (403 nếu không đủ quyền).
 */

import apiClient from '@/api/client';
import { ApiError } from '@/api/errors';

// ── DTO (camelCase — design.md; mapper hỗ trợ snake_case nếu gateway trả về) ─

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface NewsArticleDto {
  id: string;
  traderId?: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  createdAt: string;
}

export interface NewsArticleCreateDto {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string;
}

export interface NewsArticleUpdateDto {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  imageUrl?: string;
}

export interface ForecastDto {
  id: string;
  traderId?: string;
  region: string;
  cropType: string;
  type: 'price' | 'demand' | 'weather';
  forecastData: unknown;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface ForecastCreateDto {
  region: string;
  cropType: string;
  type: 'price' | 'demand' | 'weather';
  forecastData: unknown;
  validFrom: string;
  validTo: string;
}

export interface ForecastUpdateDto {
  region?: string;
  cropType?: string;
  type?: 'price' | 'demand' | 'weather';
  forecastData?: unknown;
  validFrom?: string;
  validTo?: string;
}

export interface ListNewsParams {
  page?: number;
  limit?: number;
  category?: string;
}

export interface ListForecastsParams {
  page?: number;
  limit?: number;
  region?: string;
  type?: 'price' | 'demand' | 'weather';
}

// ── Mappers (Nest có thể serialize snake_case tùy cấu hình) ─────────────────

function str(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function mapNewsArticleDto(raw: unknown): NewsArticleDto {
  const r = raw as Record<string, unknown>;
  return {
    id: str(r.id),
    traderId: (r.traderId ?? r.trader_id) as string | undefined,
    title: str(r.title),
    summary: str(r.summary),
    content: str(r.content),
    category: str(r.category),
    imageUrl: (r.imageUrl ?? r.image_url) as string | undefined,
    publishedAt: str(r.publishedAt ?? r.published_at),
    createdAt: str(r.createdAt ?? r.created_at),
  };
}

export function mapForecastDto(raw: unknown): ForecastDto {
  const r = raw as Record<string, unknown>;
  const t = r.type;
  const typeVal =
    t === 'price' || t === 'demand' || t === 'weather' ? t : 'price';
  return {
    id: str(r.id),
    traderId: (r.traderId ?? r.trader_id) as string | undefined,
    region: str(r.region),
    cropType: str(r.cropType ?? r.crop_type),
    type: typeVal,
    forecastData: r.forecastData ?? r.forecast_data,
    validFrom: str(r.validFrom ?? r.valid_from),
    validTo: str(r.validTo ?? r.valid_to),
    createdAt: str(r.createdAt ?? r.created_at),
  };
}

function mapListResponse<T>(raw: unknown, mapItem: (item: unknown) => T): ListResponse<T> {
  const r = raw as Record<string, unknown>;
  const itemsRaw = r.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapItem) : [];
  return {
    items,
    page: Number(r.page ?? 1) || 1,
    limit: Number(r.limit ?? 20) || 20,
    total: Number(r.total ?? items.length) || 0,
  };
}

// ── Thông báo lỗi tiếng Việt (Snackbar) ──────────────────────────────────────

export type NewsForecastContext =
  | 'newsList'
  | 'newsDetail'
  | 'newsCreate'
  | 'newsUpdate'
  | 'forecastList'
  | 'forecastDetail'
  | 'forecastCreate'
  | 'forecastUpdate';

export function toNewsForecastViMessage(
  err: unknown,
  context?: NewsForecastContext,
): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền thực hiện thao tác này (chỉ dành cho thương lái).';
      case 'NOT_FOUND':
        if (context === 'newsDetail') return 'Không tìm thấy bài viết.';
        if (context === 'forecastDetail') return 'Không tìm thấy dự báo.';
        return 'Không tìm thấy dữ liệu.';
      case 'INVALID_INPUT':
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        if (err.message) return err.message;
        break;
    }
  }
  switch (context) {
    case 'newsList':
      return 'Không thể tải danh sách tin tức. Vui lòng thử lại.';
    case 'newsDetail':
      return 'Không thể tải bài viết. Vui lòng thử lại.';
    case 'newsCreate':
      return 'Không thể đăng bài. Vui lòng thử lại.';
    case 'newsUpdate':
      return 'Không thể cập nhật bài viết. Vui lòng thử lại.';
    case 'forecastList':
      return 'Không thể tải dự báo. Vui lòng thử lại.';
    case 'forecastDetail':
      return 'Không thể tải chi tiết dự báo. Vui lòng thử lại.';
    case 'forecastCreate':
      return 'Không thể tạo dự báo. Vui lòng thử lại.';
    case 'forecastUpdate':
      return 'Không thể cập nhật dự báo. Vui lòng thử lại.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function listNews(
  params?: ListNewsParams,
): Promise<ListResponse<NewsArticleDto>> {
  const q: Record<string, unknown> = {};
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;
  if (params?.category) q.category = params.category;

  const { data } = await apiClient.get<unknown>('/news', { params: q });
  return mapListResponse(data, mapNewsArticleDto);
}

export async function getNews(id: string): Promise<NewsArticleDto> {
  const { data } = await apiClient.get<unknown>(`/news/${id}`);
  return mapNewsArticleDto(data);
}

export async function createNews(body: NewsArticleCreateDto): Promise<NewsArticleDto> {
  const { data } = await apiClient.post<unknown>('/news', body);
  return mapNewsArticleDto(data);
}

export async function updateNews(
  id: string,
  body: NewsArticleUpdateDto,
): Promise<NewsArticleDto> {
  const { data } = await apiClient.put<unknown>(`/news/${id}`, body);
  return mapNewsArticleDto(data);
}

export async function listForecasts(
  params?: ListForecastsParams,
): Promise<ListResponse<ForecastDto>> {
  const q: Record<string, unknown> = {};
  if (params?.page) q.page = params.page;
  if (params?.limit) q.limit = params.limit;
  if (params?.region) q.region = params.region;
  if (params?.type) q.type = params.type;

  const { data } = await apiClient.get<unknown>('/forecasts', { params: q });
  return mapListResponse(data, mapForecastDto);
}

export async function getForecast(id: string): Promise<ForecastDto> {
  const { data } = await apiClient.get<unknown>(`/forecasts/${id}`);
  return mapForecastDto(data);
}

export async function createForecast(body: ForecastCreateDto): Promise<ForecastDto> {
  const { data } = await apiClient.post<unknown>('/forecasts', body);
  return mapForecastDto(data);
}

export async function updateForecast(
  id: string,
  body: ForecastUpdateDto,
): Promise<ForecastDto> {
  const { data } = await apiClient.put<unknown>(`/forecasts/${id}`, body);
  return mapForecastDto(data);
}
