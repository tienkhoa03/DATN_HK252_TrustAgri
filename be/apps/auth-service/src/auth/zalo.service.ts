import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveZaloGraphMeUrl, resolveZaloGraphPhoneUrl } from '@trustagri/shared';

export interface ZaloUserInfo {
  id: string;
  name?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

/**
 * Gọi Zalo Graph API để xác thực zaloAccessToken và lấy thông tin người dùng.
 * Endpoint: GET https://graph.zalo.me/v2.0/me?fields=id,name,picture
 */
@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly zaloGraphMeUrl: string;
  private readonly zaloGraphPhoneUrl: string;

  constructor(private readonly config: ConfigService) {
    this.zaloGraphMeUrl = resolveZaloGraphMeUrl(
      this.config.get<string>('ZALO_GRAPH_ME_URL'),
    );
    this.zaloGraphPhoneUrl = resolveZaloGraphPhoneUrl(
      this.config.get<string>('ZALO_GRAPH_PHONE_URL'),
    );
  }

  async getUserInfo(zaloAccessToken: string): Promise<ZaloUserInfo> {
    let response: Response;
    try {
      // access_token goes in the query string — this is Zalo's documented method
      // and avoids leaking the token in proxy/load-balancer access logs
      const url = `${this.zaloGraphMeUrl}&access_token=${encodeURIComponent(zaloAccessToken)}`;
      response = await fetch(url);
    } catch (err) {
      this.logger.error('Lỗi kết nối tới Zalo API', err);
      throw new UnauthorizedException('Không thể kết nối tới Zalo để xác thực');
    }

    if (!response.ok) {
      throw new UnauthorizedException(
        `Zalo API trả về lỗi ${response.status}`,
      );
    }

    const data = (await response.json()) as ZaloUserInfo & { error?: number };

    if (data.error || !data.id) {
      throw new UnauthorizedException('zaloAccessToken không hợp lệ hoặc đã hết hạn');
    }

    return data;
  }

  /**
   * Giải mã số điện thoại Zalo Mini App theo luồng production.
   * `getPhoneNumber()` ở client trả về một `token` (code); server đổi code này lấy số thật:
   *   GET https://graph.zalo.me/v2.0/me/info
   *   Headers: access_token, code, secret_key (ZALO_APP_SECRET_KEY)
   * Fail-soft: trả null nếu chưa cấu hình secret_key hoặc bất kỳ lỗi nào — KHÔNG block login.
   */
  async getPhoneNumber(accessToken: string, code: string): Promise<string | null> {
    const secretKey = (this.config.get<string>('ZALO_APP_SECRET_KEY') ?? '').trim();
    if (!secretKey) {
      this.logger.debug('ZALO_APP_SECRET_KEY chưa cấu hình — bỏ qua giải mã số điện thoại');
      return null;
    }
    try {
      const response = await fetch(this.zaloGraphPhoneUrl, {
        headers: { access_token: accessToken, code, secret_key: secretKey },
      });
      if (!response.ok) {
        this.logger.warn(`Zalo /me/info trả về lỗi ${response.status}`);
        return null;
      }
      const body = (await response.json()) as {
        error?: number;
        data?: { number?: string };
      };
      const number = body.data?.number?.trim();
      if (body.error || !number) {
        return null;
      }
      return this.normalizePhone(number);
    } catch (err) {
      this.logger.warn('Không giải mã được số điện thoại từ Zalo', err);
      return null;
    }
  }

  /** Chuẩn hóa số điện thoại Zalo trả về (84xxxxxxxxx) sang định dạng nội địa (0xxxxxxxxx). */
  private normalizePhone(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('84') && digits.length >= 11) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  }
}
