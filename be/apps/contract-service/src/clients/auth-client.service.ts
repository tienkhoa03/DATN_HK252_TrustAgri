import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserDenormSnapshot } from '@trustagri/shared';

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);

  constructor(private readonly config: ConfigService) {}

  async getUserSnapshot(userId: string): Promise<UserDenormSnapshot> {
    const base = this.config
      .get<string>('AUTH_SERVICE_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
    const url = `${base}/api/v1/auth/users/${userId}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(`auth GET /users/${userId} → ${res.status}`);
        return { displayName: null, phone: null };
      }
      const raw = (await res.json()) as Record<string, unknown>;
      const data =
        raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object'
          ? (raw.data as Record<string, unknown>)
          : raw;
      const displayName =
        typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.display_name === 'string'
            ? data.display_name
            : null;
      const phoneRaw = data.phone ?? data.phone_number;
      const phone = typeof phoneRaw === 'string' ? phoneRaw : null;
      return { displayName, phone };
    } catch (err) {
      this.logger.warn(
        `auth không đọc được user ${userId} (${url}): ${(err as Error).message}`,
      );
      return { displayName: null, phone: null };
    }
  }

  async getUserDisplayName(userId: string): Promise<string | null> {
    return (await this.getUserSnapshot(userId)).displayName;
  }
}
