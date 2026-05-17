import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FarmDto, resolveServiceUrl, SERVICE_URL_KEYS } from '@trustagri/shared';

/**
 * Lấy ownerId của vườn từ farm-service (GET /api/v1/farms/:id public).
 */
@Injectable()
export class FarmLookupService {
  private readonly logger = new Logger(FarmLookupService.name);

  constructor(private readonly config: ConfigService) {}

  async getOwnerIdByFarmId(farmId: string): Promise<string | null> {
    const base = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
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
