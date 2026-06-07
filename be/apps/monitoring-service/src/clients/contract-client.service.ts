import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FarmThresholdsDto, resolveServiceUrl, SERVICE_URL_KEYS } from '@trustagri/shared';

const INTERNAL_HEADER = 'x-traceability-internal';

@Injectable()
export class ContractClientService {
  private readonly logger = new Logger(ContractClientService.name);

  constructor(private readonly config: ConfigService) {}

  async getFarmThresholds(farmId: string): Promise<FarmThresholdsDto | null> {
    const base = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.CONTRACT),
      SERVICE_URL_KEYS.CONTRACT,
    );
    const url = `${base}/contracts/internal/farms/${farmId}/thresholds`;
    const secret = this.config.get<string>('TRACEABILITY_INTERNAL_SECRET', '');
    try {
      const res = await fetch(url, {
        headers: secret ? { [INTERNAL_HEADER]: secret } : {},
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        this.logger.warn(`contract GET /internal/farms/${farmId}/thresholds → ${res.status}`);
        return null;
      }
      return (await res.json()) as FarmThresholdsDto;
    } catch (err) {
      this.logger.warn(
        `contract không đọc được ngưỡng farm ${farmId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
