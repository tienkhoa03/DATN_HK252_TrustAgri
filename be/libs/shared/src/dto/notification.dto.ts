import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

/**
 * Thông báo trong app (design.md §4.2 NotificationDto)
 */
export interface NotificationDto {
  id: string;
  type: 'alert' | 'contract' | 'connection' | 'system';
  title: string;
  body: string;
  severity?: 'info' | 'warning' | 'danger';
  linkTo?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Bài viết tin tức (design.md §4.2)
 */
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

export class NewsArticleCreateDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  content: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class NewsArticleUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

/**
 * Dự báo thị trường (design.md §4.2)
 */
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

export class ForecastCreateDto {
  @IsString()
  region: string;

  @IsString()
  cropType: string;

  @IsIn(['price', 'demand', 'weather'])
  type: 'price' | 'demand' | 'weather';

  forecastData: unknown;

  @IsString()
  validFrom: string;

  @IsString()
  validTo: string;
}
