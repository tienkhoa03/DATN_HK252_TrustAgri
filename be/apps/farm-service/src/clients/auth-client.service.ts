import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);

  constructor(private readonly config: ConfigService) {}

  async getUserDisplayName(userId: string): Promise<string | null> {
    const base = this.config
      .get<string>('AUTH_SERVICE_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
    const url = `${base}/api/v1/auth/users/${userId}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(`auth GET /users/${userId} → ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { displayName?: string };
      return data.displayName ?? null;
    } catch (err) {
      this.logger.warn(
        `auth không đọc được user ${userId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
