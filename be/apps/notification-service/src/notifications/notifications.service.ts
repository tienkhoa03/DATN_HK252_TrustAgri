import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertDto,
  ConnectionDto,
  ContractChangeRequestDto,
  ContractDto,
  ListResponse,
  NotificationDto,
} from '@trustagri/shared';
import { NotificationEntity } from './notification.entity';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { ZnsAdapterService } from './services/zns-adapter.service';
import { FarmLookupService } from './services/farm-lookup.service';

/** Khớp channel contract-service — Redis payload. */
export interface ContractChangedEventPayload {
  contract: ContractDto;
  changeRequest?: ContractChangeRequestDto;
}

export const REDIS_CHANNEL_ALERT_CREATED = 'alert.created';
export const REDIS_CHANNEL_CONTRACT_CHANGED = 'contract.changed';
export const REDIS_CHANNEL_CONNECTION_REQUESTED = 'connection.requested';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly zns: ZnsAdapterService,
    private readonly farmLookup: FarmLookupService,
  ) {}

  async list(
    userId: string,
    query: NotificationListQueryDto,
  ): Promise<ListResponse<NotificationDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC');

    if (query.unreadOnly === true) {
      qb.andWhere('n.read = false');
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((e) => this.toDto(e)),
      page,
      limit,
      total,
    };
  }

  async markRead(
    userId: string,
    id: string,
  ): Promise<{ success: true }> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Thông báo không tồn tại');
    }
    if (!row.read) {
      row.read = true;
      row.readAt = new Date();
      await this.repo.save(row);
    }
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  /** Consumer: alert.created — payload AlertDto JSON. */
  async handleAlertCreated(alert: AlertDto): Promise<void> {
    const ownerId = await this.farmLookup.getOwnerIdByFarmId(alert.farmId);
    if (!ownerId) {
      this.logger.warn(
        `Không gửi thông báo alert ${alert.id}: không tìm được chủ vườn`,
      );
      return;
    }

    const sevMap: Record<string, 'warning' | 'danger'> = {
      warning: 'warning',
      danger: 'danger',
    };
    const severity = sevMap[alert.severity] ?? 'warning';

    const title = 'Cảnh báo cảm biến';
    const body = `${alert.sensorType} vượt ngưỡng (${alert.severity}). Giá trị: ${alert.value}, ngưỡng: ${alert.threshold}.`;

    await this.createAndPushZns(ownerId, {
      type: 'alert',
      title,
      body,
      severity,
      linkTo: `/farms/${alert.farmId}/monitoring?alertId=${alert.id}`,
    });
  }

  /** Consumer: contract.changed */
  async handleContractChanged(payload: ContractChangedEventPayload): Promise<void> {
    const { contract, changeRequest } = payload;
    const recipients = new Set<string>();
    if (contract.partyFarmerId) recipients.add(contract.partyFarmerId);
    if (contract.partyTraderId) recipients.add(contract.partyTraderId);
    if (contract.partyBuyerId) recipients.add(contract.partyBuyerId);

    const title = 'Hợp đồng cập nhật';
    const body = changeRequest
      ? `Yêu cầu thay đổi hợp đồng (${changeRequest.status}). ${changeRequest.reason ?? ''}`.trim()
      : `Hợp đồng ${contract.id} đã được cập nhật.`;

    for (const uid of recipients) {
      await this.createAndPushZns(uid, {
        type: 'contract',
        title,
        body,
        severity: 'info',
        linkTo: `/contracts/${contract.id}`,
      });
    }
  }

  /** Consumer: connection.requested — ConnectionDto JSON. */
  async handleConnectionRequested(conn: ConnectionDto): Promise<void> {
    const title = 'Lời mời kết nối';
    const body = conn.message
      ? `Bạn có lời mời kết nối mới: ${conn.message}`
      : 'Bạn có lời mời kết nối mới.';

    await this.createAndPushZns(conn.toUserId, {
      type: 'connection',
      title,
      body,
      severity: 'info',
      linkTo: `/connections/${conn.id}`,
    });
  }

  private async createAndPushZns(
    userId: string,
    data: {
      type: NotificationEntity['type'];
      title: string;
      body: string;
      severity?: NotificationEntity['severity'];
      linkTo?: string;
    },
  ): Promise<void> {
    const row = this.repo.create({
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      severity: data.severity,
      linkTo: data.linkTo,
      read: false,
    });
    const saved = await this.repo.save(row);

    // Retry ZNS delivery up to 3 times with exponential backoff before giving up.
    // A failed delivery is logged as an error so alerting can surface it.
    void this.sendZnsWithRetry(saved.id, userId, data.title, data.body);
  }

  private async sendZnsWithRetry(
    notificationId: string,
    userId: string,
    title: string,
    body: string,
    attempt = 1,
    maxAttempts = 3,
  ): Promise<void> {
    try {
      await this.zns.sendNotification({ userId, title, body });
    } catch (err) {
      if (attempt < maxAttempts) {
        const delay = 1000 * 2 ** attempt;
        this.logger.warn(
          `ZNS gửi thất bại (lần ${attempt}/${maxAttempts}) cho notification ${notificationId} — thử lại sau ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.sendZnsWithRetry(notificationId, userId, title, body, attempt + 1, maxAttempts);
      } else {
        this.logger.error(
          `ZNS gửi thất bại sau ${maxAttempts} lần cho notification ${notificationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  private toDto(e: NotificationEntity): NotificationDto {
    return {
      id: e.id,
      type: e.type,
      title: e.title,
      body: e.body,
      severity: e.severity,
      linkTo: e.linkTo,
      read: e.read,
      readAt: e.readAt?.toISOString(),
      createdAt: e.createdAt.toISOString(),
    };
  }
}
