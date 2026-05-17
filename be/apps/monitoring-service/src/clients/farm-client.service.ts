import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveServiceUrl, SERVICE_URL_KEYS } from '@trustagri/shared';

@Injectable()
export class FarmClientService {
  private readonly logger = new Logger(FarmClientService.name);

  constructor(private readonly config: ConfigService) {}

  async getFarmName(farmId: string): Promise<string | null> {
    const base = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
    const url = `${base}/api/v1/farms/${farmId}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(`farm GET /farms/${farmId} → ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { name?: string };
      return data.name ?? null;
    } catch (err) {
      this.logger.warn(
        `farm không đọc được vườn ${farmId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
