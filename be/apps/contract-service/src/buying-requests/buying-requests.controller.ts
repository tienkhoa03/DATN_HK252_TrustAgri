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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  BuyingRequestDto,
  CreateBuyingRequestDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { BuyingRequestsService } from './buying-requests.service';
import { BuyingRequestQueryDto } from './dto/buying-request-query.dto';
import { UpdateBuyingRequestDto } from './dto/update-buying-request.dto';

/**
 * Nhu cầu mua hàng từ người mua
 *
 * GET    /api/v1/buying-requests        — danh sách (buyer thấy của mình, trader thấy tất cả)
 * GET    /api/v1/buying-requests/:id    — chi tiết
 * POST   /api/v1/buying-requests        — buyer, tạo nhu cầu
 * PUT    /api/v1/buying-requests/:id    — buyer owner, cập nhật
 * DELETE /api/v1/buying-requests/:id   — buyer owner, soft delete
 */
@Controller('buying-requests')
export class BuyingRequestsController {
  constructor(private readonly buyingRequestsService: BuyingRequestsService) {}

  /**
   * GET /api/v1/buying-requests
   * Danh sách nhu cầu mua hàng với lọc và phân trang.
   * Trader thấy tất cả; Buyer chỉ thấy của chính mình.
   */
  @Get()
  @Roles('buyer', 'trader')
  listBuyingRequests(
    @Query() query: BuyingRequestQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListResponse<BuyingRequestDto>> {
    return this.buyingRequestsService.listBuyingRequests(
      query,
      user.sub,
      user.role,
    );
  }

  /**
   * GET /api/v1/buying-requests/:id
   * Chi tiết nhu cầu mua hàng.
   */
  @Get(':id')
  @Roles('buyer', 'trader')
  getBuyingRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<BuyingRequestDto> {
    return this.buyingRequestsService.getBuyingRequest(id);
  }

  /**
   * POST /api/v1/buying-requests
   * Tạo nhu cầu mua hàng. Chỉ dành cho người mua.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('buyer')
  createBuyingRequest(
    @Body() dto: CreateBuyingRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BuyingRequestDto> {
    return this.buyingRequestsService.createBuyingRequest(dto, user.sub);
  }

  /**
   * PUT /api/v1/buying-requests/:id
   * Cập nhật nhu cầu mua hàng. Chỉ người mua chủ sở hữu.
   */
  @Put(':id')
  @Roles('buyer')
  updateBuyingRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateBuyingRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BuyingRequestDto> {
    return this.buyingRequestsService.updateBuyingRequest(id, dto, user.sub);
  }

  /**
   * DELETE /api/v1/buying-requests/:id
   * Xóa mềm nhu cầu mua hàng. Chỉ người mua chủ sở hữu.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('buyer')
  deleteBuyingRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.buyingRequestsService.deleteBuyingRequest(id, user.sub);
  }
}
