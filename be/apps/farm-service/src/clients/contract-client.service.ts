import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContractDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';

/**
 * Client gọi contract-service từ farm-service (chiều cross-service).
 * Dùng cho luồng traceability: resolve mã `TRC-…` → hợp đồng → dữ liệu trace.
 */
@Injectable()
export class ContractClientService {
  private readonly logger = new Logger(ContractClientService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Tra cứu hợp đồng theo mã traceability công khai.
   * Trả về null nếu không tồn tại / lỗi mạng — caller fallback sang farm code cũ.
   */
  async getByTraceCode(code: string): Promise<ContractDto | null> {
    const base = resolveServiceUrl(
      this.config.get<string>(SERVICE_URL_KEYS.CONTRACT),
      SERVICE_URL_KEYS.CONTRACT,
    );
    const secret = this.config.get<string>('TRACEABILITY_INTERNAL_SECRET');
    const headers: Record<string, string> = {};
    if (secret) headers['X-Traceability-Internal'] = secret;

    const url = `${base.replace(/\/$/, '')}/api/v1/contracts/internal/by-trace/${encodeURIComponent(code)}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers,
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        this.logger.warn(`contract GET /internal/by-trace/${code} → ${res.status}`);
        return null;
      }
      return (await res.json()) as ContractDto;
    } catch (err) {
      this.logger.warn(
        `Không gọi được contract-service cho trace code ${code}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
