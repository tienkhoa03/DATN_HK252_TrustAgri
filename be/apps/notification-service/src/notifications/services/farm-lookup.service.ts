import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FarmDto } from '@trustagri/shared';

/**
 * Lấy ownerId của vườn từ farm-service (GET /api/v1/farms/:id public).
 */
@Injectable()
export class FarmLookupService {
  private readonly logger = new Logger(FarmLookupService.name);

  constructor(private readonly config: ConfigService) {}

  async getOwnerIdByFarmId(farmId: string): Promise<string | null> {
    const base = this.config
      .get<string>('FARM_SERVICE_URL', 'http://localhost:3003')
      .replace(/\/$/, '');
    const url = `${base}/api/v1/farms/${encodeURIComponent(farmId)}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        this.logger.warn(
          `Farm lookup ${farmId} failed: HTTP ${res.status}`,
        );
        return null;
      }
      const farm = (await res.json()) as FarmDto;
      return farm.ownerId ?? null;
    } catch (err) {
      this.logger.error(
        `Farm lookup ${farmId} error: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
