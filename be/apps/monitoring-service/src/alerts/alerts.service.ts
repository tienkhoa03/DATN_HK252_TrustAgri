import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AlertDto, ListResponse, SensorReadingDto } from '@trustagri/shared';
import { AlertEntity } from './alert.entity';
import { AlertQueryDto } from './dto/alert-query.dto';
import { AlertPublisherService } from './services/alert-publisher.service';
import { FarmClientService } from '../clients/farm-client.service';
import { AuthClientService } from '../clients/auth-client.service';
import { settledValue } from '../clients/settled.util';

interface SensorThreshold {
  min?: number;
  max?: number;
}

interface ThresholdConfig {
  warning: SensorThreshold;
  danger: SensorThreshold;
}

/**
 * Ngưỡng cảnh báo theo loại cảm biến.
 * Mỗi loại có hai mức: warning (cảnh báo sớm) và danger (nguy hiểm).
 */
const THRESHOLDS: Record<string, ThresholdConfig> = {
  temperature: {
    warning: { min: 15, max: 35 },
    danger: { min: 10, max: 40 },
  },
  humidity: {
    warning: { min: 30, max: 80 },
    danger: { min: 20, max: 90 },
  },
  light: {
    warning: { min: 1_000, max: 80_000 },
    danger: { min: 500, max: 100_000 },
  },
  soil_moisture: {
    warning: { min: 30, max: 70 },
    danger: { min: 20, max: 80 },
  },
};

/**
 * Hành động đề xuất theo loại cảm biến và hướng vượt ngưỡng.
 */
const SUGGESTED_ACTIONS: Record<string, { high: string; low: string }> = {
  temperature: {
    high: 'Tưới nước để giảm nhiệt độ đất, kiểm tra hệ thống tưới phun.',
    low: 'Che phủ đất bằng rơm hoặc màng phủ, bảo vệ cây khỏi nhiệt độ thấp.',
  },
  humidity: {
    high: 'Tăng thông gió nhà kính, kiểm tra hệ thống thoát nước và giảm tần suất tưới.',
    low: 'Tăng tần suất tưới, sử dụng màng phủ đất để giữ ẩm.',
  },
  light: {
    high: 'Lắp lưới che nắng hoặc điều chỉnh mái che để giảm cường độ ánh sáng.',
    low: 'Tỉa cành che khuất, bổ sung đèn chiếu sáng nhân tạo nếu cần.',
  },
  soil_moisture: {
    high: 'Kiểm tra hệ thống thoát nước, giảm lượng nước tưới và tần suất tưới.',
    low: 'Tưới bổ sung ngay lập tức, kiểm tra đường ống và đầu phun tưới.',
  },
};

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepo: Repository<AlertEntity>,
    private readonly publisher: AlertPublisherService,
    private readonly farmClient: FarmClientService,
    private readonly authClient: AuthClientService,
  ) {}

  /**
   * Kiểm tra giá trị cảm biến có vượt ngưỡng không và tạo alert nếu cần.
   * Tránh spam: bỏ qua nếu đã có alert unacknowledged cùng farm/sensorType/severity.
   */
  async checkAndCreateAlert(reading: SensorReadingDto): Promise<void> {
    const config = THRESHOLDS[reading.sensorType];
    if (!config) return;

    const result = this.detectThresholdBreach(reading.value, config);
    if (!result) return;

    const { severity, thresholdValue, isHigh } = result;

    // Deduplicate: không tạo alert mới nếu đã có alert chưa được acknowledge
    const existing = await this.alertRepo.findOne({
      where: {
        farmId: reading.farmId,
        sensorType: reading.sensorType,
        severity,
        acknowledged: false,
      },
    });
    if (existing) return;

    const suggestedAction =
      SUGGESTED_ACTIONS[reading.sensorType]?.[isHigh ? 'high' : 'low'];

    const [farmNameRes] = await Promise.allSettled([
      this.farmClient.getFarmName(reading.farmId),
    ]);

    const entity = this.alertRepo.create({
      farmId: reading.farmId,
      farmName: settledValue(farmNameRes),
      sensorType: reading.sensorType,
      severity,
      threshold: thresholdValue,
      value: reading.value,
      suggestedAction,
      acknowledged: false,
    });

    const saved = await this.alertRepo.save(entity);
    this.logger.log(
      `Alert created: id=${saved.id} farm=${reading.farmId} sensor=${reading.sensorType} severity=${severity}`,
    );

    await this.publisher.publishAlertCreated(this.toDto(saved));
  }

  async listAlerts(
    farmId: string,
    query: AlertQueryDto,
  ): Promise<ListResponse<AlertDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? 'all';

    const where: FindOptionsWhere<AlertEntity> = { farmId };

    if (status === 'unacknowledged') {
      where.acknowledged = false;
    } else if (status === 'acknowledged') {
      where.acknowledged = true;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    const [entities, total] = await this.alertRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: entities.map((e) => this.toDto(e)),
      page,
      limit,
      total,
    };
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException('Cảnh báo không tồn tại');
    }

    const [ackNameRes] = await Promise.allSettled([
      this.authClient.getUserDisplayName(userId),
    ]);

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedByName = settledValue(ackNameRes);
    alert.acknowledgedAt = new Date();
    await this.alertRepo.save(alert);

    return { success: true };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private detectThresholdBreach(
    value: number,
    config: ThresholdConfig,
  ): { severity: 'warning' | 'danger'; thresholdValue: number; isHigh: boolean } | null {
    // Check danger level first (stricter)
    if (config.danger.max !== undefined && value > config.danger.max) {
      return { severity: 'danger', thresholdValue: config.danger.max, isHigh: true };
    }
    if (config.danger.min !== undefined && value < config.danger.min) {
      return { severity: 'danger', thresholdValue: config.danger.min, isHigh: false };
    }
    // Then warning level
    if (config.warning.max !== undefined && value > config.warning.max) {
      return { severity: 'warning', thresholdValue: config.warning.max, isHigh: true };
    }
    if (config.warning.min !== undefined && value < config.warning.min) {
      return { severity: 'warning', thresholdValue: config.warning.min, isHigh: false };
    }
    return null;
  }

  private toDto(entity: AlertEntity): AlertDto {
    return {
      id: entity.id,
      farmId: entity.farmId,
      farmName: entity.farmName ?? null,
      sensorType: entity.sensorType,
      severity: entity.severity,
      threshold: entity.threshold,
      value: entity.value,
      suggestedAction: entity.suggestedAction,
      acknowledged: entity.acknowledged,
      acknowledgedBy: entity.acknowledgedBy,
      acknowledgedByName: entity.acknowledgedByName ?? null,
      acknowledgedAt: entity.acknowledgedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
