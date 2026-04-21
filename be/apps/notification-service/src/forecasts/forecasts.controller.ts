import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
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

@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecasts: ForecastsService) {}

  @Public()
  @Get()
  list(
    @Query() query: ForecastListQueryDto,
  ): Promise<ListResponse<ForecastDto>> {
    return this.forecasts.list(query);
  }

  @Post()
  @Roles('trader')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ForecastCreateDto,
  ): Promise<ForecastDto> {
    return this.forecasts.create(user.sub, dto);
  }

  @Put(':id')
  @Roles('trader')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ForecastUpdateDto,
  ): Promise<ForecastDto> {
    return this.forecasts.update(user.sub, id, dto);
  }
}
