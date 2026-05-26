import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ComplianceCertificateDto,
  EnvironmentReadingDto,
  InternalContractRefDto,
  resolveServiceUrl,
  SERVICE_URL_KEYS,
} from '@trustagri/shared';

const logger = new Logger('TraceabilityInternalClients');

function buildHeaders(config: ConfigService): Record<string, string> {
  const secret = config.get<string>('TRACEABILITY_INTERNAL_SECRET');
  return secret ? { 'X-Traceability-Internal': secret } : {};
}

export async function fetchCurrentEnvironment(
  farmId: string,
  config: ConfigService,
): Promise<EnvironmentReadingDto[]> {
  const base = resolveServiceUrl(
    config.get<string>(SERVICE_URL_KEYS.MONITORING),
    SERVICE_URL_KEYS.MONITORING,
  );
  const url = `${base.replace(/\/$/, '')}/api/v1/monitoring/traceability/farms/${farmId}/current-environment`;
  try {
    const res = await fetch(url, {
      headers: buildHeaders(config),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      logger.warn(`monitoring current-environment ${res.status} farm=${farmId} — trả []`);
      return [];
    }
    return (await res.json()) as EnvironmentReadingDto[];
  } catch (err) {
    logger.warn(`fetchCurrentEnvironment failed farm=${farmId}: ${(err as Error).message}`);
    return [];
  }
}

export async function fetchComplianceCertificate(
  farmId: string,
  config: ConfigService,
): Promise<ComplianceCertificateDto | undefined> {
  const base = resolveServiceUrl(
    config.get<string>(SERVICE_URL_KEYS.CONTRACT),
    SERVICE_URL_KEYS.CONTRACT,
  );
  const url = `${base.replace(/\/$/, '')}/api/v1/contracts/internal/farms/${farmId}/active-compliance`;
  try {
    const res = await fetch(url, {
      headers: buildHeaders(config),
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      logger.warn(`contract active-compliance ${res.status} farm=${farmId} — ẩn thẻ chứng nhận`);
      return undefined;
    }
    return (await res.json()) as ComplianceCertificateDto;
  } catch (err) {
    logger.warn(`fetchComplianceCertificate failed farm=${farmId}: ${(err as Error).message}`);
    return undefined;
  }
}

export async function fetchComplianceCertificateByContractId(
  contractId: string,
  config: ConfigService,
): Promise<ComplianceCertificateDto | undefined> {
  const base = resolveServiceUrl(
    config.get<string>(SERVICE_URL_KEYS.CONTRACT),
    SERVICE_URL_KEYS.CONTRACT,
  );
  const url = `${base.replace(/\/$/, '')}/api/v1/contracts/internal/${contractId}/compliance`;
  try {
    const res = await fetch(url, {
      headers: buildHeaders(config),
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      logger.warn(`contract compliance by contractId ${res.status} contractId=${contractId} — ẩn thẻ`);
      return undefined;
    }
    return (await res.json()) as ComplianceCertificateDto;
  } catch (err) {
    logger.warn(`fetchComplianceCertificateByContractId failed contractId=${contractId}: ${(err as Error).message}`);
    return undefined;
  }
}

export async function fetchContractByCode(
  code: string,
  config: ConfigService,
): Promise<InternalContractRefDto | null> {
  const base = resolveServiceUrl(
    config.get<string>(SERVICE_URL_KEYS.CONTRACT),
    SERVICE_URL_KEYS.CONTRACT,
  );
  const url = `${base.replace(/\/$/, '')}/api/v1/contracts/internal/by-trace-code/${encodeURIComponent(code)}`;
  try {
    const res = await fetch(url, {
      headers: buildHeaders(config),
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      logger.warn(`contract by-trace-code ${res.status} code=${code}`);
      return null;
    }
    return (await res.json()) as InternalContractRefDto;
  } catch (err) {
    logger.warn(`fetchContractByCode failed code=${code}: ${(err as Error).message}`);
    return null;
  }
}

export async function fetchActiveContractForFarm(
  farmId: string,
  config: ConfigService,
): Promise<InternalContractRefDto | null> {
  const base = resolveServiceUrl(
    config.get<string>(SERVICE_URL_KEYS.CONTRACT),
    SERVICE_URL_KEYS.CONTRACT,
  );
  const url = `${base.replace(/\/$/, '')}/api/v1/contracts/internal/farms/${farmId}/active-contract`;
  try {
    const res = await fetch(url, {
      headers: buildHeaders(config),
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      logger.warn(`contract active-contract ${res.status} farm=${farmId}`);
      return null;
    }
    return (await res.json()) as InternalContractRefDto;
  } catch (err) {
    logger.warn(`fetchActiveContractForFarm failed farm=${farmId}: ${(err as Error).message}`);
    return null;
  }
}
