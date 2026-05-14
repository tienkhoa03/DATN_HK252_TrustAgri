import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CurrentUser,
  ForecastCreateDto,
  ForecastDto,
  ForecastUpdateDto,
  JwtPayload,
  ListResponse,
  Public,
  Roles,
} from '@trustagri/shared';
import { ForecastsService } from './forecasts.service';
import { ForecastListQueryDto } from './dto/forecast-list-query.dto';

@ApiTags('forecasts')
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecasts: ForecastsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List market forecasts filtered by region and type (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of forecasts' })
  list(
    @Query() query: ForecastListQueryDto,
  ): Promise<ListResponse<ForecastDto>> {
    return this.forecasts.list(query);
  }

  @Post()
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a market forecast (trader only)' })
  @ApiResponse({ status: 201, description: 'Forecast created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ForecastCreateDto,
  ): Promise<ForecastDto> {
    return this.forecasts.create(user.sub, dto);
  }

  @Put(':id')
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a market forecast (author trader only)' })
  @ApiResponse({ status: 200, description: 'Forecast updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author trader' })
  @ApiResponse({ status: 404, description: 'Forecast not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ForecastUpdateDto,
  ): Promise<ForecastDto> {
    return this.forecasts.update(user.sub, id, dto);
  }
}
