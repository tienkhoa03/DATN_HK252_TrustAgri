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
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /api/v1/orders
   */
  @Get()
  @Roles('buyer', 'trader')
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
  cancelOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderDto> {
    return this.ordersService.cancelOrder(id, user.sub);
  }
}
