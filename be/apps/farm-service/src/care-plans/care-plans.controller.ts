import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@trustagri/shared';
import { CarePlansService } from './care-plans.service';
import { CarePlanResponseDto, CompleteTaskResponseDto } from '@trustagri/shared';

@Controller('farms')
@UseGuards(JwtAuthGuard)
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  /** GET /api/v1/farms/:farmId/care-plan/today */
  @Get(':farmId/care-plan/today')
  getTodayPlan(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CarePlanResponseDto> {
    return this.carePlansService.getTodayPlan(farmId, user.sub);
  }

  /** POST /api/v1/farms/:farmId/care-plan/tasks/:standardStepId/complete */
  @Post(':farmId/care-plan/tasks/:standardStepId/complete')
  completeTask(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('standardStepId', ParseUUIDPipe) standardStepId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompleteTaskResponseDto> {
    return this.carePlansService.completeTask(farmId, standardStepId, user.sub);
  }
}
