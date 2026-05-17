import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IotDeviceDto,
  CreateIotDeviceDto,
  UpdateIotDeviceDto,
} from '@trustagri/shared';
import { IotDeviceEntity } from './entities/iot-device.entity';
import { FarmClientService } from '../clients/farm-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(IotDeviceEntity)
    private readonly repo: Repository<IotDeviceEntity>,
    private readonly farmClient: FarmClientService,
  ) {}

  /** Lấy danh sách node devices của vườn, sắp xếp theo createdAt mới nhất trước */
  async listByFarm(farmId: string): Promise<IotDeviceDto[]> {
    const entities = await this.repo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDto(e));
  }

  /** Tạo mới IoT node device; mặc định status='offline' nếu không truyền */
  async create(farmId: string, dto: CreateIotDeviceDto): Promise<IotDeviceDto> {
    const [farmNameRes] = await Promise.allSettled([
      this.farmClient.getFarmName(farmId),
    ]);

    const device = this.repo.create({
      farmId,
      farmName: settledValue(farmNameRes),
      name: dto.name,
      status: dto.status ?? 'offline',
      batteryLevel: dto.batteryLevel ?? null,
      sensorTypes: dto.sensorTypes,
      firmwareVersion: dto.firmwareVersion ?? null,
    });
    const saved = await this.repo.save(device);
    this.logger.log({
      action: 'iot_device.created',
      deviceId: saved.id,
      farmId,
    });
    return this.toDto(saved);
  }

  /** Cập nhật thông tin device; trả NotFoundException nếu đã xoá hoặc không tồn tại */
  async update(id: string, dto: UpdateIotDeviceDto): Promise<IotDeviceDto> {
    const device = await this.repo.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException(`IoT device không tồn tại: ${id}`);
    }

    if (dto.name !== undefined) device.name = dto.name;
    if (dto.status !== undefined) device.status = dto.status;
    if (dto.batteryLevel !== undefined) device.batteryLevel = dto.batteryLevel;
    if (dto.sensorTypes !== undefined) device.sensorTypes = dto.sensorTypes;
    if (dto.firmwareVersion !== undefined) device.firmwareVersion = dto.firmwareVersion;

    const saved = await this.repo.save(device);
    this.logger.log({ action: 'iot_device.updated', deviceId: id });
    return this.toDto(saved);
  }

  /** Soft delete — đặt deletedAt; trả NotFoundException nếu không tìm thấy */
  async softDelete(id: string): Promise<{ success: true }> {
    const device = await this.repo.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException(`IoT device không tồn tại: ${id}`);
    }
    await this.repo.softDelete(id);
    this.logger.log({ action: 'iot_device.deleted', deviceId: id });
    return { success: true };
  }

  private toDto(entity: IotDeviceEntity): IotDeviceDto {
    return {
      id: entity.id,
      farmId: entity.farmId,
      farmName: entity.farmName ?? null,
      name: entity.name,
      status: entity.status,
      batteryLevel: entity.batteryLevel,
      sensorTypes: entity.sensorTypes,
      firmwareVersion: entity.firmwareVersion,
      lastSeenAt: entity.lastSeenAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
