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
  FarmDto,
  CreateFarmDto,
  UpdateFarmDto,
  ListResponse,
  Roles,
  CurrentUser,
  JwtPayload,
} from '@trustagri/shared';
import { FarmsService } from './farms.service';
import { ListFarmsQueryDto } from './dto/list-farms-query.dto';

@ApiTags('farms')
@ApiBearerAuth()
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  /**
   * POST /api/v1/farms
   * Tạo hồ sơ vườn — chỉ farmer được tạo.
   */
  @Post()
  @Roles('farmer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new farm (farmer only)' })
  @ApiResponse({ status: 201, description: 'Farm created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farmer role required' })
  create(
    @Body() dto: CreateFarmDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FarmDto> {
    return this.farmsService.create(dto, user.sub);
  }

  /**
   * GET /api/v1/farms
   * Danh sách vườn với lọc region, cropType, ownerId và phân trang.
   */
  @Get()
  @ApiOperation({ summary: 'List farms with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of farms' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(@Query() query: ListFarmsQueryDto): Promise<ListResponse<FarmDto>> {
    return this.farmsService.list(query);
  }

  /**
   * GET /api/v1/farms/:id
   * Chi tiết một vườn.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get farm details by ID' })
  @ApiResponse({ status: 200, description: 'Farm details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  findOne(@Param('id') id: string): Promise<FarmDto> {
    return this.farmsService.findOne(id);
  }

  /**
   * PUT /api/v1/farms/:id
   * Cập nhật vườn — chỉ chủ sở hữu được sửa.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update farm details (owner only)' })
  @ApiResponse({ status: 200, description: 'Farm updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only farm owner can update' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FarmDto> {
    return this.farmsService.update(id, dto, user.sub);
  }

  /**
   * DELETE /api/v1/farms/:id
   * Xóa vườn — chỉ chủ sở hữu, và không có hợp đồng active tham chiếu.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a farm (owner only, no active contracts)' })
  @ApiResponse({ status: 204, description: 'Farm deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Farm has active contracts' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.farmsService.remove(id, user.sub);
  }
}
