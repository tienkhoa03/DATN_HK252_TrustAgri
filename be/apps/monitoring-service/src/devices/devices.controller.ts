import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateIotDeviceDto, UpdateIotDeviceDto, IotDeviceDto } from '@trustagri/shared';
import { DevicesService } from './devices.service';

/**
 * Quản lý IoT node devices theo từng vườn (B1 — device CRUD)
 *
 * GET    /api/v1/monitoring/farms/:farmId/devices
 * POST   /api/v1/monitoring/farms/:farmId/devices
 * PATCH  /api/v1/monitoring/devices/:id
 * DELETE /api/v1/monitoring/devices/:id
 *
 * Auth: JwtAuthGuard được apply global qua applyTrustagriHttpStack (main.ts).
 * TODO Phase later — xác minh caller là chủ vườn HOẶC có hợp đồng active
 * với vườn này qua cross-service call tới farm-service / contract-service.
 */
@Controller('monitoring')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /** GET /api/v1/monitoring/farms/:farmId/devices */
  @Get('farms/:farmId/devices')
  listByFarm(
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ): Promise<IotDeviceDto[]> {
    return this.devicesService.listByFarm(farmId);
  }

  /** POST /api/v1/monitoring/farms/:farmId/devices */
  @Post('farms/:farmId/devices')
  create(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateIotDeviceDto,
  ): Promise<IotDeviceDto> {
    return this.devicesService.create(farmId, dto);
  }

  /** PATCH /api/v1/monitoring/devices/:id */
  @Patch('devices/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIotDeviceDto,
  ): Promise<IotDeviceDto> {
    return this.devicesService.update(id, dto);
  }

  /** DELETE /api/v1/monitoring/devices/:id */
  @Delete('devices/:id')
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: true }> {
    return this.devicesService.softDelete(id);
  }
}
