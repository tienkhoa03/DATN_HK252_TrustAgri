import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ZnsSendParams {
  userId: string;
  title: string;
  body: string;
}

/**
 * Gửi thông báo qua Zalo (ZNS webhook nội bộ hoặc OA API) với exponential backoff,
 * tối đa 3 lần thử lại sau lỗi (4 lần gọi tổng cộng).
 *
 * - Ưu tiên `ZALO_ZNS_WEBHOOK_URL`: POST JSON `{ userId, title, body }` (bridge tới ZNS/OA).
 * - Hoặc `ZALO_OA_ACCESS_TOKEN` + `ZALO_OA_MESSAGE_API_URL`: POST theo cấu hình OA.
 * - Nếu không cấu hình: bỏ qua (dev), không ném lỗi.
 */
@Injectable()
export class ZnsAdapterService {
  private readonly logger = new Logger(ZnsAdapterService.name);

  constructor(private readonly config: ConfigService) {}

  async sendNotification(params: ZnsSendParams): Promise<void> {
    const webhook = this.config.get<string>('ZALO_ZNS_WEBHOOK_URL');
    const token = this.config.get<string>('ZALO_OA_ACCESS_TOKEN');
    const oaUrl = this.config.get<string>('ZALO_OA_MESSAGE_API_URL');

    if (!webhook && !(token && oaUrl)) {
      this.logger.debug(
        `ZNS bỏ qua (chưa cấu hình webhook hoặc OA): ${params.title}`,
      );
      return;
    }

    const maxRetries = 3;
    let lastErr: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (webhook) {
          await this.postWebhook(webhook, params);
        } else if (token && oaUrl) {
          await this.postOa(oaUrl, token, params);
        }
        return;
      } catch (err) {
        lastErr = err as Error;
        this.logger.warn(
          `ZNS gửi thất bại (lần ${attempt + 1}/${maxRetries + 1}): ${lastErr.message}`,
        );
        if (attempt === maxRetries) break;
        const delayMs = 1000 * Math.pow(2, attempt);
        await this.sleep(delayMs);
      }
    }

    this.logger.error(
      `ZNS dừng sau ${maxRetries + 1} lần thử: ${lastErr?.message}`,
    );
  }

  private async postWebhook(url: string, params: ZnsSendParams): Promise<void> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        title: params.title,
        body: params.body,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text}`);
    }
  }

  private async postOa(
    url: string,
    token: string,
    params: ZnsSendParams,
  ): Promise<void> {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { user_id: params.userId },
        message: { text: `${params.title}\n${params.body}` },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
