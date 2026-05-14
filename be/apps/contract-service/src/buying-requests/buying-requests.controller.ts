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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
@ApiTags('buying-requests')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'List buying requests (trader sees all, buyer sees own)' })
  @ApiResponse({ status: 200, description: 'Paginated list of buying requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get buying request details by ID' })
  @ApiResponse({ status: 200, description: 'Buying request details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Buying request not found' })
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
  @ApiOperation({ summary: 'Create a buying request (buyer only)' })
  @ApiResponse({ status: 201, description: 'Buying request created with open status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - buyer role required' })
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
  @ApiOperation({ summary: 'Update a buying request (owner buyer only)' })
  @ApiResponse({ status: 200, description: 'Buying request updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only buyer owner' })
  @ApiResponse({ status: 404, description: 'Buying request not found' })
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
  @ApiOperation({ summary: 'Soft delete a buying request (owner buyer only)' })
  @ApiResponse({ status: 204, description: 'Buying request deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only buyer owner' })
  deleteBuyingRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.buyingRequestsService.deleteBuyingRequest(id, user.sub);
  }
}
