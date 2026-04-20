import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  StandardDto,
  CreateStandardDto,
  UpdateStandardDto,
  ListResponse,
  Roles,
  CurrentUser,
  JwtPayload,
} from '@trustagri/shared';
import { StandardsService } from './standards.service';
import { ListStandardsQueryDto } from './dto/list-standards-query.dto';

@Controller('standards')
export class StandardsController {
  constructor(private readonly standardsService: StandardsService) {}

  /**
   * GET /api/v1/standards
   * Danh sách tiêu chuẩn — lọc theo ownerTraderId.
   * Public: cả farmer, trader, buyer, guest đều đọc được.
   */
  @Get()
  list(
    @Query() query: ListStandardsQueryDto,
  ): Promise<ListResponse<StandardDto>> {
    return this.standardsService.list(query);
  }

  /**
   * GET /api/v1/standards/:id
   * Chi tiết tiêu chuẩn kèm steps.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<StandardDto> {
    return this.standardsService.findOne(id);
  }

  /**
   * POST /api/v1/standards
   * Tạo tiêu chuẩn mới — chỉ trader.
   */
  @Post()
  @Roles('trader')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateStandardDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StandardDto> {
    return this.standardsService.create(dto, user.sub);
  }

  /**
   * PUT /api/v1/standards/:id
   * Cập nhật tiêu chuẩn — chỉ trader sở hữu.
   */
  @Put(':id')
  @Roles('trader')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStandardDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StandardDto> {
    return this.standardsService.update(id, dto, user.sub);
  }

  /**
   * DELETE /api/v1/standards/:id
   * Soft delete tiêu chuẩn — chỉ trader sở hữu.
   */
  @Delete(':id')
  @Roles('trader')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.standardsService.remove(id, user.sub);
  }
}
