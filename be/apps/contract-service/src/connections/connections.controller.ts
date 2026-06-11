import {
  Controller,
  Get,
  Post,
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
  ConnectionDto,
  CreateConnectionDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
  UserProfileDto,
} from '@trustagri/shared';
import { ConnectionsService } from './connections.service';
import { ConnectionQueryDto } from './dto/connection-query.dto';
import { SearchTraderQueryDto } from './dto/search-trader-query.dto';
import { SearchFarmerQueryDto } from './dto/search-farmer-query.dto';

/**
 * Tìm kiếm thương lái và nông dân.
 * GET /api/v1/traders/search
 * GET /api/v1/farmers/search
 */
@ApiTags('search')
@ApiBearerAuth()
@Controller()
export class SearchController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * GET /api/v1/traders/search
   * Nông dân tìm thương lái phù hợp (lọc region, cropType, trustScore).
   */
  @Get('traders/search')
  @Roles('farmer', 'trader', 'buyer')
  @ApiOperation({ summary: 'Search for traders by region, crop type, and trust score' })
  @ApiResponse({ status: 200, description: 'Paginated list of matching traders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  searchTraders(
    @Query() query: SearchTraderQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    return this.connectionsService.searchTraders(query);
  }

  /**
   * GET /api/v1/farmers/search
   * Thương lái tìm nguồn cung nông dân (lọc region, cropType).
   */
  @Get('farmers/search')
  @Roles('farmer', 'trader', 'buyer')
  @ApiOperation({ summary: 'Search for farmers by region and crop type' })
  @ApiResponse({ status: 200, description: 'Paginated list of matching farmers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  searchFarmers(
    @Query() query: SearchFarmerQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    return this.connectionsService.searchFarmers(query);
  }
}

/**
 * Quản lý kết nối nông dân – thương lái.
 * GET    /api/v1/connections
 * POST   /api/v1/connections
 * DELETE /api/v1/connections/:id
 * POST   /api/v1/connections/:id/accept
 * POST   /api/v1/connections/:id/reject
 */
@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * GET /api/v1/connections
   * Danh sách kết nối của người dùng hiện tại (lọc role=incoming|outgoing, status).
   */
  @Get()
  @ApiOperation({ summary: 'List connections for the authenticated user (incoming/outgoing)' })
  @ApiResponse({ status: 200, description: 'Paginated list of connections' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ConnectionQueryDto,
  ): Promise<ListResponse<ConnectionDto>> {
    return this.connectionsService.listConnections(user.sub, query);
  }

  /**
   * POST /api/v1/connections
   * Gửi yêu cầu kết nối đến nông dân hoặc thương lái.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('farmer', 'trader')
  @ApiOperation({ summary: 'Send a connection request to a farmer or trader' })
  @ApiResponse({ status: 201, description: 'Connection request sent with pending status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farmer or trader role required' })
  create(
    @Body() dto: CreateConnectionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    const role = user.role as 'farmer' | 'trader';
    return this.connectionsService.createConnection(dto, user.sub, role);
  }

  /**
   * DELETE /api/v1/connections/:id
   * Hủy kết nối (pending hoặc accepted) — cả hai phía đều được phép.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  @ApiOperation({ summary: 'Withdraw a pending connection request (sender only)' })
  @ApiResponse({ status: 200, description: 'Connection request withdrawn' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only the sender can withdraw' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean }> {
    return this.connectionsService.deleteConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/accept
   * Chấp nhận yêu cầu kết nối (chỉ người nhận).
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  @ApiOperation({ summary: 'Accept a connection request (recipient only)' })
  @ApiResponse({ status: 200, description: 'Connection accepted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only the recipient can accept' })
  accept(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.acceptConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/reject
   * Từ chối yêu cầu kết nối (chỉ người nhận).
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  @ApiOperation({ summary: 'Reject a connection request (recipient only)' })
  @ApiResponse({ status: 200, description: 'Connection rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only the recipient can reject' })
  reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.rejectConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/negotiate
   *
   * Alias: chuyển kết nối từ trạng thái `pending` sang `accepted` để bắt đầu
   * đàm phán hợp đồng. Khớp với Bảng 5.5 báo cáo.
   *
   * Lưu ý kỹ thuật: entity Connection không có trạng thái riêng `negotiating` —
   * trạng thái `accepted` biểu thị hai bên đã đồng ý kết nối và có thể bắt đầu
   * đàm phán. Endpoint này là thin alias của /accept.
   * Chỉ người nhận mới được gọi. Ném ConflictException nếu không ở trạng thái `pending`.
   */
  @Post(':id/negotiate')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  @ApiOperation({
    summary: 'Alias: accept connection to start negotiation (pending → accepted)',
    description:
      'Thin alias of POST /connections/:id/accept. The Connection entity has no separate ' +
      '"negotiating" status; "accepted" represents the negotiation phase. Only the recipient may call.',
  })
  @ApiResponse({ status: 200, description: 'Connection accepted (negotiation started)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only the recipient can start negotiation' })
  @ApiResponse({ status: 409, description: 'Conflict - connection is not in pending state' })
  negotiate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    // Delegates to acceptConnection which enforces pending guard + recipient check
    return this.connectionsService.acceptConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/sign
   *
   * Alias: xác nhận kết nối `accepted` đã đi đến thỏa thuận ("ký kết").
   * Khớp với Bảng 5.5 báo cáo.
   *
   * Lưu ý kỹ thuật: entity Connection không có trạng thái riêng `signed` —
   * hợp đồng thực sự (ContractEntity) giữ trạng thái ký. Endpoint này trả về
   * kết nối hiện tại nếu đang ở `accepted`, hoặc ném ConflictException nếu không phải.
   * Cả hai phía của kết nối đều được phép gọi.
   */
  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  @ApiOperation({
    summary: 'Alias: confirm signed agreement on an accepted connection',
    description:
      'Thin alias endpoint documented in Table 5.5. The Connection entity has no "signed" status; ' +
      'formal signing is tracked by ContractEntity. This endpoint returns the accepted connection ' +
      'to confirm both parties have agreed. Throws 409 if connection is not in "accepted" state.',
  })
  @ApiResponse({ status: 200, description: 'Connection confirmed (accepted state)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - must be a participant of the connection' })
  @ApiResponse({ status: 409, description: 'Conflict - connection is not in accepted state' })
  sign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.confirmSign(id, user.sub);
  }

}
