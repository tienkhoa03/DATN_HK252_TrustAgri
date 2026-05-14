import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CurrentUser,
  DashboardBuyerDto,
  DashboardFarmerDto,
  DashboardTraderDto,
  JwtPayload,
  Roles,
} from '@trustagri/shared';
import { DashboardService } from './dashboard.service';

/**
 * GET /api/v1/dashboard/trader|farmer|buyer — tổng hợp dashboard theo vai trò (design.md §4.4.7).
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('trader')
  @Roles('trader')
  @ApiOperation({ summary: 'Get trader dashboard summary (orders, demand, crops, contracts)' })
  @ApiResponse({ status: 200, description: 'Trader dashboard data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  getTrader(@CurrentUser() user: JwtPayload): Promise<DashboardTraderDto> {
    return this.dashboardService.getTraderDashboard(user);
  }

  @Get('farmer')
  @Roles('farmer')
  @ApiOperation({ summary: 'Get farmer dashboard summary (compliance, alerts, contracts, care logs)' })
  @ApiResponse({ status: 200, description: 'Farmer dashboard data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farmer role required' })
  getFarmer(
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<DashboardFarmerDto> {
    return this.dashboardService.getFarmerDashboard(user, authorization);
  }

  @Get('buyer')
  @Roles('buyer')
  @ApiOperation({ summary: 'Get buyer dashboard summary (buying requests, proposals, orders)' })
  @ApiResponse({ status: 200, description: 'Buyer dashboard data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - buyer role required' })
  getBuyer(@CurrentUser() user: JwtPayload): Promise<DashboardBuyerDto> {
    return this.dashboardService.getBuyerDashboard(user);
  }
}
