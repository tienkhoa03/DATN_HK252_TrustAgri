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
@Controller()
export class SearchController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * GET /api/v1/traders/search
   * Nông dân tìm thương lái phù hợp (lọc region, cropType, trustScore).
   */
  @Get('traders/search')
  @Roles('farmer', 'trader', 'buyer')
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
  searchFarmers(
    @Query() query: SearchFarmerQueryDto,
  ): Promise<ListResponse<UserProfileDto>> {
    return this.connectionsService.searchFarmers(query);
  }
}

/**
 * Quản lý kết nối nông dân – thương lái.
 * GET  /api/v1/connections
 * POST /api/v1/connections
 * POST /api/v1/connections/:id/accept
 * POST /api/v1/connections/:id/reject
 */
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * GET /api/v1/connections
   * Danh sách kết nối của người dùng hiện tại (lọc role=incoming|outgoing, status).
   */
  @Get()
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
  create(
    @Body() dto: CreateConnectionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    const role = user.role as 'farmer' | 'trader';
    return this.connectionsService.createConnection(dto, user.sub, role);
  }

  /**
   * POST /api/v1/connections/:id/accept
   * Chấp nhận yêu cầu kết nối (chỉ người nhận).
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
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
  reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.rejectConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/negotiate
   * Bắt đầu đàm phán hợp tác (accepted → negotiating). Cả hai bên đều được phép.
   */
  @Post(':id/negotiate')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  negotiate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.negotiateConnection(id, user.sub);
  }

  /**
   * POST /api/v1/connections/:id/sign
   * Xác nhận đã ký hợp đồng (negotiating → signed). Cả hai bên đều được phép.
   */
  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Roles('farmer', 'trader')
  sign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConnectionDto> {
    return this.connectionsService.signConnection(id, user.sub);
  }
}
