import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface TraderReviewDto {
  id: string;
  traderId: string;
  buyerId: string;
  traderDisplayName?: string | null;
  buyerDisplayName?: string | null;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustScoreDto {
  traderId: string;
  /** null khi chưa có review */
  average: number | null;
  count: number;
}

export class CreateTraderReviewDto {
  @ApiProperty({ description: 'Order ID this review is for', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Rating from 1 to 5 stars', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Optional review comment (max 500 chars)', example: 'Good quality rice, delivered on time.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class UpdateTraderReviewDto {
  @ApiPropertyOptional({ description: 'Updated rating from 1 to 5 stars', example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Updated review comment (max 500 chars)', example: 'Excellent quality and service!', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
