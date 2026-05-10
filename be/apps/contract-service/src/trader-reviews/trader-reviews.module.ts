import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraderReviewEntity } from './entities/trader-review.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { TraderReviewsService } from './trader-reviews.service';
import { TraderReviewsController, ReviewsController } from './trader-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TraderReviewEntity, OrderEntity])],
  controllers: [TraderReviewsController, ReviewsController],
  providers: [TraderReviewsService],
  exports: [TraderReviewsService],
})
export class TraderReviewsModule {}
