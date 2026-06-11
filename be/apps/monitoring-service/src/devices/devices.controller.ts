import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateIotDeviceDto,
  CurrentUser,
  IotDeviceDto,
  JwtPayload,
  UpdateIotDeviceDto,
} from '@trustagri/shared';
import { DevicesService } from './devices.service';
import { FarmAccessGuard } from '../sensors/guards/farm-access.guard';

/**
 * Quản lý IoT node devices theo từng vườn (B1 — device CRUD)
 *
 * GET    /api/v1/monitoring/farms/:farmId/devices  — chủ vườn | trader có hợp đồng active
 * POST   /api/v1/monitoring/farms/:farmId/devices  — chủ vườn only
 * PATCH  /api/v1/monitoring/devices/:id            — chủ vườn only (kiểm tra qua device.farmId)
 * DELETE /api/v1/monitoring/devices/:id            — chủ vườn only
 *
 * Phân quyền farmId-scoped (GET + POST) dùng FarmAccessGuard (sensors/guards).
 * Các mutation không có farmId trong path tự kiểm tra quyền qua devicesService.
 * FR-M01, NFR-S02.
 */
@ApiTags('iot-devices')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('monitoring')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * GET /api/v1/monitoring/farms/:farmId/devices
   * Chủ vườn + trader có hợp đồng active → được phép đọc.
   */
  @Get('farms/:farmId/devices')
  @UseGuards(FarmAccessGuard)
  @ApiOperation({ summary: 'List IoT devices registered for a farm' })
  @ApiResponse({ status: 200, description: 'List of IoT devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - no farm access' })
  listByFarm(
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ): Promise<IotDeviceDto[]> {
    return this.devicesService.listByFarm(farmId);
  }

  /**
   * POST /api/v1/monitoring/farms/:farmId/devices
   * Chỉ chủ vườn mới được đăng ký thiết bị mới.
   */
  @Post('farms/:farmId/devices')
  @UseGuards(FarmAccessGuard)
  @ApiOperation({ summary: 'Register a new IoT device for a farm (farm owner only)' })
  @ApiResponse({ status: 201, description: 'IoT device registered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farm owner required' })
  async create(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateIotDeviceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IotDeviceDto> {
    // FarmAccessGuard already passed — but traders with contract are read-only.
    // Verify caller is the farm owner before write operations.
    await this.devicesService.assertFarmOwner(farmId, user.sub);
    return this.devicesService.create(farmId, dto);
  }

  /**
   * PATCH /api/v1/monitoring/devices/:id
   * Chỉ chủ vườn mới được cập nhật thiết bị (kiểm tra qua device.farmId).
   */
  @Patch('devices/:id')
  @ApiOperation({ summary: 'Update IoT device metadata (name, battery, firmware, status) — farm owner only' })
  @ApiResponse({ status: 200, description: 'IoT device updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farm owner required' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIotDeviceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IotDeviceDto> {
    await this.devicesService.assertDeviceOwner(id, user.sub);
    return this.devicesService.update(id, dto);
  }

  /**
   * DELETE /api/v1/monitoring/devices/:id
   * Chỉ chủ vườn mới được xóa mềm thiết bị.
   */
  @Delete('devices/:id')
  @ApiOperation({ summary: 'Soft delete an IoT device — farm owner only' })
  @ApiResponse({ status: 200, description: 'Device soft deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - farm owner required' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    await this.devicesService.assertDeviceOwner(id, user.sub);
    return this.devicesService.softDelete(id);
  }
}
