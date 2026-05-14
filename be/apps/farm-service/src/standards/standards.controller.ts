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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

@ApiTags('standards')
@ApiBearerAuth()
@Controller('standards')
export class StandardsController {
  constructor(private readonly standardsService: StandardsService) {}

  /**
   * GET /api/v1/standards
   * Danh sách tiêu chuẩn — lọc theo ownerTraderId.
   * Public: cả farmer, trader, buyer, guest đều đọc được.
   */
  @Get()
  @ApiOperation({ summary: 'List farming standards with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of standards' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get standard details including all steps' })
  @ApiResponse({ status: 200, description: 'Standard details with steps' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Standard not found' })
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
  @ApiOperation({ summary: 'Create a new farming standard (trader only)' })
  @ApiResponse({ status: 201, description: 'Standard created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
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
  @ApiOperation({ summary: 'Update a farming standard (owner trader only)' })
  @ApiResponse({ status: 200, description: 'Standard updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owner trader' })
  @ApiResponse({ status: 404, description: 'Standard not found' })
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
  @ApiOperation({ summary: 'Soft delete a standard (owner trader only)' })
  @ApiResponse({ status: 204, description: 'Standard deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owner trader' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.standardsService.remove(id, user.sub);
  }
}
