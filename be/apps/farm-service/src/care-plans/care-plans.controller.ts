import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@trustagri/shared';
import { CarePlansService } from './care-plans.service';
import { CarePlanResponseDto, CompleteTaskResponseDto } from '@trustagri/shared';

@ApiTags('care-plans')
@ApiBearerAuth()
@Controller('farms')
@UseGuards(JwtAuthGuard)
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  /** GET /api/v1/farms/:farmId/care-plan/today */
  @Get(':farmId/care-plan/today')
  @ApiOperation({ summary: "Get today's care plan tasks for a farm" })
  @ApiResponse({ status: 200, description: "Today's care plan with pending tasks" })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  getTodayPlan(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CarePlanResponseDto> {
    return this.carePlansService.getTodayPlan(farmId, user.sub);
  }

  /** POST /api/v1/farms/:farmId/care-plan/tasks/:standardStepId/complete */
  @Post(':farmId/care-plan/tasks/:standardStepId/complete')
  @ApiOperation({ summary: 'Mark a care plan task as complete (creates a care log)' })
  @ApiResponse({ status: 201, description: 'Task marked complete, care log created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Farm or step not found' })
  completeTask(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('standardStepId', ParseUUIDPipe) standardStepId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompleteTaskResponseDto> {
    return this.carePlansService.completeTask(farmId, standardStepId, user.sub);
  }
}
