import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export interface TraderReviewDto {
  id: string;
  traderId: string;
  buyerId: string;
  buyerDisplayName?: string;
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
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class UpdateTraderReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
