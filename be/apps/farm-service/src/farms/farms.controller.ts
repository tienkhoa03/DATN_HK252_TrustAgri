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
  list(@Query() query: ListFarmsQueryDto): Promise<ListResponse<FarmDto>> {
    return this.farmsService.list(query);
  }

  /**
   * GET /api/v1/farms/:id
   * Chi tiết một vườn.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<FarmDto> {
    return this.farmsService.findOne(id);
  }

  /**
   * PUT /api/v1/farms/:id
   * Cập nhật vườn — chỉ chủ sở hữu được sửa.
   */
  @Put(':id')
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
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.farmsService.remove(id, user.sub);
  }
}
