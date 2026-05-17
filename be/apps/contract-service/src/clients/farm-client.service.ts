import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveServiceUrl, SERVICE_URL_KEYS } from '@trustagri/shared';

@Injectable()
export class FarmClientService {
  private readonly logger = new Logger(FarmClientService.name);

  constructor(private readonly config: ConfigService) {}

  private farmBase(): string {
    return resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.FARM),
      SERVICE_URL_KEYS.FARM,
    );
  }

  async applyStandardToFarm(farmId: string, standardId: string): Promise<void> {
    const base = this.farmBase();
    const url = `${base}/api/v1/farms/${farmId}/standard`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`farm PATCH /farms/${farmId}/standard → ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(
        `farm applyStandard ${farmId} thất bại: ${(err as Error).message}`,
      );
    }
  }

  async getFarmName(farmId: string): Promise<string | null> {
    const base = this.farmBase();
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

  async getStandardName(standardId: string): Promise<string | null> {
    const base = this.farmBase();
    const url = `${base}/api/v1/standards/${standardId}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(`farm GET /standards/${standardId} → ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { name?: string };
      return data.name ?? null;
    } catch (err) {
      this.logger.warn(
        `farm không đọc được tiêu chuẩn ${standardId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
