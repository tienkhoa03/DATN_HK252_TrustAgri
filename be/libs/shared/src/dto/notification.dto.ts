import { IsString, IsOptional, IsIn, Allow } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Article title', example: 'Rice prices surge in Mekong Delta Q1 2024' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Short summary of the article', example: 'Paddy rice prices increased 15% due to export demand.' })
  @IsString()
  summary: string;

  @ApiProperty({ description: 'Full article content (HTML or markdown)', example: '<p>Detailed content here...</p>' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Article category', example: 'market-news' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://cdn.example.com/news/rice-market.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class NewsArticleUpdateDto {
  @ApiPropertyOptional({ description: 'Article title', example: 'Updated: Rice prices surge in Mekong Delta' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Short summary', example: 'Updated summary.' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Full article content', example: '<p>Updated content...</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Article category', example: 'market-news' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://cdn.example.com/news/rice-updated.jpg' })
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
  @ApiProperty({ description: 'Region this forecast applies to', example: 'Mekong Delta' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Crop type', example: 'rice' })
  @IsString()
  cropType: string;

  @ApiProperty({ description: 'Forecast type', enum: ['price', 'demand', 'weather'], example: 'price' })
  @IsIn(['price', 'demand', 'weather'])
  type: 'price' | 'demand' | 'weather';

  @ApiProperty({ description: 'Forecast data payload (structure depends on type)', example: { pricePerKg: 23500, confidence: 0.85 } })
  @Allow()
  forecastData: unknown;

  @ApiProperty({ description: 'Forecast valid from (ISO 8601)', example: '2024-04-01T00:00:00Z' })
  @IsString()
  validFrom: string;

  @ApiProperty({ description: 'Forecast valid to (ISO 8601)', example: '2024-04-30T23:59:59Z' })
  @IsString()
  validTo: string;
}

export class ForecastUpdateDto {
  @ApiPropertyOptional({ description: 'Region', example: 'Mekong Delta' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Crop type', example: 'rice' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ description: 'Forecast type', enum: ['price', 'demand', 'weather'], example: 'demand' })
  @IsOptional()
  @IsIn(['price', 'demand', 'weather'])
  type?: 'price' | 'demand' | 'weather';

  @ApiPropertyOptional({ description: 'Updated forecast data payload', example: { demandIndex: 1.2 } })
  @IsOptional()
  @Allow()
  forecastData?: unknown;

  @ApiPropertyOptional({ description: 'Valid from (ISO 8601)', example: '2024-05-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid to (ISO 8601)', example: '2024-05-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  validTo?: string;
}
