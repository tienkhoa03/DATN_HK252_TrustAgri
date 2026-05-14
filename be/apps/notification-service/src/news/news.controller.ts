import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List news articles with optional category filter (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of news articles' })
  list(@Query() query: NewsListQueryDto): Promise<ListResponse<NewsArticleDto>> {
    return this.news.list(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a news article by ID (public)' })
  @ApiResponse({ status: 200, description: 'News article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  getOne(@Param('id') id: string): Promise<NewsArticleDto> {
    return this.news.findById(id);
  }

  @Post()
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a news article (trader only)' })
  @ApiResponse({ status: 201, description: 'News article created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: NewsArticleCreateDto,
  ): Promise<NewsArticleDto> {
    return this.news.create(user.sub, dto);
  }

  @Put(':id')
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a news article (author trader only)' })
  @ApiResponse({ status: 200, description: 'News article updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author trader' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: NewsArticleUpdateDto,
  ): Promise<NewsArticleDto> {
    return this.news.update(user.sub, id, dto);
  }
}
