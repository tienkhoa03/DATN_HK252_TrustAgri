import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

export interface ZaloUserInfo {
  id: string;
  name: string;
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
  private readonly ZALO_API_URL =
    'https://graph.zalo.me/v2.0/me?fields=id,name,picture';

  async getUserInfo(zaloAccessToken: string): Promise<ZaloUserInfo> {
    let response: Response;
    try {
      response = await fetch(this.ZALO_API_URL, {
        headers: { access_token: zaloAccessToken },
      });
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
}
