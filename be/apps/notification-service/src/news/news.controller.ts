import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
  NewsArticleCreateDto,
  NewsArticleDto,
  NewsArticleUpdateDto,
  Public,
  Roles,
  ListResponse,
} from '@trustagri/shared';
import { NewsService } from './news.service';
import { NewsListQueryDto } from './dto/news-list-query.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Public()
  @Get()
  list(@Query() query: NewsListQueryDto): Promise<ListResponse<NewsArticleDto>> {
    return this.news.list(query);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string): Promise<NewsArticleDto> {
    return this.news.findById(id);
  }

  @Post()
  @Roles('trader')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: NewsArticleCreateDto,
  ): Promise<NewsArticleDto> {
    return this.news.create(user.sub, dto);
  }

  @Put(':id')
  @Roles('trader')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: NewsArticleUpdateDto,
  ): Promise<NewsArticleDto> {
    return this.news.update(user.sub, id, dto);
  }
}
