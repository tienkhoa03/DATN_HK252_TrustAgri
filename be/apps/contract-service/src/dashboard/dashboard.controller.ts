import { Controller, Get, Headers } from '@nestjs/common';
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
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('trader')
  @Roles('trader')
  getTrader(@CurrentUser() user: JwtPayload): Promise<DashboardTraderDto> {
    return this.dashboardService.getTraderDashboard(user);
  }

  @Get('farmer')
  @Roles('farmer')
  getFarmer(
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<DashboardFarmerDto> {
    return this.dashboardService.getFarmerDashboard(user, authorization);
  }

  @Get('buyer')
  @Roles('buyer')
  getBuyer(@CurrentUser() user: JwtPayload): Promise<DashboardBuyerDto> {
    return this.dashboardService.getBuyerDashboard(user);
  }
}
