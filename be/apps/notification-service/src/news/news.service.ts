import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ListResponse,
  NewsArticleCreateDto,
  NewsArticleDto,
  NewsArticleUpdateDto,
} from '@trustagri/shared';
import { NewsArticleEntity } from './news-article.entity';
import { NewsListQueryDto } from './dto/news-list-query.dto';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsArticleEntity)
    private readonly repo: Repository<NewsArticleEntity>,
    private readonly authClient: AuthClientService,
  ) {}

  private toDto(e: NewsArticleEntity): NewsArticleDto {
    return {
      id: e.id,
      traderId: e.traderId,
      traderDisplayName: e.traderDisplayName ?? null,
      title: e.title,
      summary: e.summary,
      content: e.content,
      category: e.category,
      imageUrl: e.imageUrl ?? undefined,
      publishedAt: e.publishedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
    };
  }

  async list(query: NewsListQueryDto): Promise<ListResponse<NewsArticleDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy('a.publishedAt', 'DESC');

    if (query.category) {
      qb.andWhere('a.category = :category', { category: query.category });
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((e) => this.toDto(e)),
      page,
      limit,
      total,
    };
  }

  async findById(id: string): Promise<NewsArticleDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
    return this.toDto(row);
  }

  async create(
    traderId: string,
    dto: NewsArticleCreateDto,
  ): Promise<NewsArticleDto> {
    const [traderNameRes] = await Promise.allSettled([
      this.authClient.getUserDisplayName(traderId),
    ]);

    const now = new Date();
    const entity = this.repo.create({
      traderId,
      traderDisplayName: settledValue(traderNameRes),
      title: dto.title,
      summary: dto.summary,
      content: dto.content,
      category: dto.category,
      imageUrl: dto.imageUrl ?? null,
      publishedAt: now,
    });
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(
    traderId: string,
    id: string,
    dto: NewsArticleUpdateDto,
  ): Promise<NewsArticleDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
    if (row.traderId !== traderId) {
      throw new ForbiddenException('Bạn không có quyền sửa bài viết này');
    }
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.summary !== undefined) row.summary = dto.summary;
    if (dto.content !== undefined) row.content = dto.content;
    if (dto.category !== undefined) row.category = dto.category;
    if (dto.imageUrl !== undefined) row.imageUrl = dto.imageUrl ?? null;
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }
}
