import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateTraderReviewDto,
  ListResponse,
  TraderReviewDto,
  TrustScoreDto,
  UpdateTraderReviewDto,
} from '@trustagri/shared';
import { TraderReviewEntity } from './entities/trader-review.entity';
import { OrderEntity } from '../orders/entities/order.entity';

// Raw row returned by the list query (snake_case columns from PostgreSQL)
interface ReviewRawRow {
  id: string;
  trader_id: string;
  buyer_id: string;
  order_id: string | null;
  rating: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
  buyer_display_name: string | null;
}

@Injectable()
export class TraderReviewsService {
  private readonly logger = new Logger(TraderReviewsService.name);

  constructor(
    @InjectRepository(TraderReviewEntity)
    private readonly reviewRepo: Repository<TraderReviewEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createReview(
    buyerId: string,
    traderId: string,
    dto: CreateTraderReviewDto,
  ): Promise<TraderReviewDto> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Bạn không phải người mua của giao dịch này');
    }
    if (order.traderId !== traderId) {
      throw new ForbiddenException('Thương lái không khớp với giao dịch');
    }
    if (order.status !== 'completed') {
      throw new ForbiddenException('Chỉ có thể đánh giá giao dịch đã hoàn thành');
    }

    const existing = await this.reviewRepo.findOne({
      where: { buyerId, orderId: dto.orderId },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá giao dịch này rồi');
    }

    const review = this.reviewRepo.create({
      traderId,
      buyerId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    const saved = await this.reviewRepo.save(review);
    this.logger.log({ action: 'review.create', traderId, buyerId, rating: dto.rating });

    return this.toDto(saved);
  }

  async listReviews(
    traderId: string,
    query: { page?: number; limit?: number },
  ): Promise<ListResponse<TraderReviewDto>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<ReviewRawRow[]>(
      `SELECT tr.id, tr.trader_id, tr.buyer_id, tr.order_id, tr.rating, tr.comment,
              tr.created_at, tr.updated_at,
              u.display_name AS buyer_display_name
       FROM trader_reviews tr
       LEFT JOIN users u ON u.user_id = tr.buyer_id
       WHERE tr.trader_id = $1 AND tr.deleted_at IS NULL
       ORDER BY tr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [traderId, limit, offset],
    );

    const countResult = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) AS count FROM trader_reviews WHERE trader_id = $1 AND deleted_at IS NULL`,
      [traderId],
    );
    const total = Number(countResult[0]?.count ?? 0);

    const items = rows.map((row) => this.rawToDto(row));
    return { items, page, limit, total };
  }

  async getTrustScore(traderId: string): Promise<TrustScoreDto> {
    const result = await this.dataSource.query<[{ avg: string | null; count: string }]>(
      `SELECT AVG(rating)::numeric AS avg, COUNT(*) AS count
       FROM trader_reviews
       WHERE trader_id = $1 AND deleted_at IS NULL`,
      [traderId],
    );

    const avg = result[0]?.avg ?? null;
    const count = Number(result[0]?.count ?? 0);
    return {
      traderId,
      average: avg !== null ? parseFloat(Number(avg).toFixed(1)) : null,
      count,
    };
  }

  async updateReview(
    reviewId: string,
    buyerId: string,
    dto: UpdateTraderReviewDto,
  ): Promise<TraderReviewDto> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }
    if (review.buyerId !== buyerId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - review.createdAt.getTime() > sevenDaysMs) {
      throw new ForbiddenException('Chỉ có thể chỉnh sửa trong 7 ngày');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment ?? null;

    const saved = await this.reviewRepo.save(review);
    this.logger.log({ action: 'review.update', reviewId, buyerId });

    return this.toDto(saved);
  }

  async deleteReview(reviewId: string, buyerId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }
    if (review.buyerId !== buyerId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    review.deletedAt = new Date();
    await this.reviewRepo.save(review);
    this.logger.log({ action: 'review.delete', reviewId, buyerId });
  }

  private toDto(review: TraderReviewEntity, buyerDisplayName?: string): TraderReviewDto {
    return {
      id: review.id,
      traderId: review.traderId,
      buyerId: review.buyerId,
      buyerDisplayName,
      orderId: review.orderId ?? undefined,
      rating: review.rating,
      comment: review.comment ?? undefined,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private rawToDto(row: ReviewRawRow): TraderReviewDto {
    return {
      id: row.id,
      traderId: row.trader_id,
      buyerId: row.buyer_id,
      buyerDisplayName: row.buyer_display_name ?? undefined,
      orderId: row.order_id ?? undefined,
      rating: Number(row.rating),
      comment: row.comment ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
