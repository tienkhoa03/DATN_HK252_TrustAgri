import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  OrderDto,
  CreateOrderDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { OrdersService } from './orders.service';
import { OrderQueryDto } from './dto/order-query.dto';

/**
 * Đơn hàng (buyer đặt mua trực tiếp từ sản phẩm của thương lái)
 *
 * GET  /api/v1/orders              — danh sách (buyer/trader)
 * GET  /api/v1/orders/:id          — chi tiết
 * POST /api/v1/orders              — buyer, tạo đơn hàng
 * POST /api/v1/orders/:id/accept   — trader, xác nhận đơn → tạo hợp đồng
 * POST /api/v1/orders/:id/reject   — trader, từ chối đơn
 * POST /api/v1/orders/:id/cancel   — buyer, hủy đơn (trước khi xác nhận)
 */
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /api/v1/orders
   */
  @Get()
  @Roles('buyer', 'trader')
  @ApiOperation({ summary: 'List orders (buyer sees own, trader sees all their orders)' })
  @ApiResponse({ status: 200, description: 'Paginated list of orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListResponse<OrderDto>> {
    return this.ordersService.listOrders(query, user.sub, user.role);
  }

  /**
   * GET /api/v1/orders/:id
   */
  @Get(':id')
  @Roles('buyer', 'trader')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<OrderDto> {
    return this.ordersService.getOrder(id);
  }

  /**
   * POST /api/v1/orders
   * Buyer đặt mua trực tiếp từ sản phẩm marketplace.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('buyer')
  @ApiOperation({ summary: 'Create an order from a marketplace product (buyer only)' })
  @ApiResponse({ status: 201, description: 'Order created with pending status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - buyer role required' })
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderDto> {
    return this.ordersService.createOrder(dto, user.sub);
  }

  /**
   * POST /api/v1/orders/:id/accept
   * Trader xác nhận đơn hàng → trạng thái contracted và tạo hợp đồng.
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles('trader')
  @ApiOperation({ summary: 'Accept an order (trader only), creates a contract automatically' })
  @ApiResponse({ status: 200, description: 'Order accepted and contract created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  acceptOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderDto> {
    return this.ordersService.acceptOrder(id, user.sub);
  }

  /**
   * POST /api/v1/orders/:id/reject
   * Trader từ chối đơn hàng.
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('trader')
  @ApiOperation({ summary: 'Reject an order (trader only)' })
  @ApiResponse({ status: 200, description: 'Order rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  rejectOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderDto> {
    return this.ordersService.rejectOrder(id, user.sub);
  }

  /**
   * POST /api/v1/orders/:id/cancel
   * Buyer hủy đơn hàng trước khi thương lái xác nhận.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('buyer')
  @ApiOperation({ summary: 'Cancel an order before trader acceptance (buyer only)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - buyer role required' })
  cancelOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderDto> {
    return this.ordersService.cancelOrder(id, user.sub);
  }
}
