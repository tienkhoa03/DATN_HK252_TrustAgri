import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateTraderReviewDto,
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  ListResponse,
  TraderReviewDto,
  TrustScoreDto,
  UpdateTraderReviewDto,
} from '@trustagri/shared';
import { TraderReviewsService } from './trader-reviews.service';

/**
 * Routes scoped to a specific trader:
 *   POST /api/v1/traders/:traderId/reviews
 *   GET  /api/v1/traders/:traderId/reviews
 *   GET  /api/v1/traders/:traderId/trust-score
 */
@ApiTags('trader-reviews')
@ApiBearerAuth()
@Controller('traders/:traderId')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TraderReviewsController {
  constructor(private readonly service: TraderReviewsService) {}

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a trader (buyer only, tied to an order)' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - buyer role required' })
  createReview(
    @Param('traderId', new ParseUUIDPipe({ version: '4' })) traderId: string,
    @Body() dto: CreateTraderReviewDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TraderReviewDto> {
    if (user.role !== 'buyer') {
      throw new ForbiddenException('Chỉ người mua mới có thể đánh giá thương lái');
    }
    return this.service.createReview(user.sub, traderId, dto);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List all reviews for a trader' })
  @ApiResponse({ status: 200, description: 'Paginated list of trader reviews' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listReviews(
    @Param('traderId', new ParseUUIDPipe({ version: '4' })) traderId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ListResponse<TraderReviewDto>> {
    return this.service.listReviews(traderId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('trust-score')
  @ApiOperation({ summary: 'Get the trust score (average rating) for a trader' })
  @ApiResponse({ status: 200, description: 'Trust score with average and review count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTrustScore(
    @Param('traderId', new ParseUUIDPipe({ version: '4' })) traderId: string,
  ): Promise<TrustScoreDto> {
    return this.service.getTrustScore(traderId);
  }
}

/**
 * Routes scoped to a specific review:
 *   PATCH  /api/v1/reviews/:id
 *   DELETE /api/v1/reviews/:id
 */
@ApiTags('trader-reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReviewsController {
  constructor(private readonly service: TraderReviewsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review (author only)' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only review author' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  updateReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTraderReviewDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TraderReviewDto> {
    return this.service.updateReview(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (author only)' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only review author' })
  deleteReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.deleteReview(id, user.sub);
  }
}
