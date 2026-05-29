/** Env keys cho base URL giữa các microservice (không slash cuối). */
export const SERVICE_URL_KEYS = {
  AUTH: 'AUTH_SERVICE_URL',
  NOTIFICATION: 'NOTIFICATION_SERVICE_URL',
  FARM: 'FARM_SERVICE_URL',
  CONTRACT: 'CONTRACT_SERVICE_URL',
  MONITORING: 'MONITORING_SERVICE_URL',
} as const;

export type ServiceUrlEnvKey =
  (typeof SERVICE_URL_KEYS)[keyof typeof SERVICE_URL_KEYS];

const LOCALHOST_PORTS: Record<ServiceUrlEnvKey, number> = {
  AUTH_SERVICE_URL: 3001,
  NOTIFICATION_SERVICE_URL: 3002,
  FARM_SERVICE_URL: 3003,
  CONTRACT_SERVICE_URL: 3004,
  MONITORING_SERVICE_URL: 3005,
};

/** Base URL (không slash cuối) từ giá trị env hoặc http://localhost:{port}. */
export function resolveServiceUrl(
  raw: string | undefined,
  key: ServiceUrlEnvKey,
): string {
  const port = LOCALHOST_PORTS[key];
  const value = raw?.trim() || `http://localhost:${port}`;
  return value.replace(/\/$/, '');
}

/** Đọc base URL từ process.env (WebSocket gateway, script, v.v.). */
export function serviceUrlFromEnv(key: ServiceUrlEnvKey): string {
  return resolveServiceUrl(process.env[key], key);
}

export const INFLUXDB_URL_DEFAULT = 'http://localhost:8086';

export function resolveInfluxUrl(raw?: string): string {
  return (raw?.trim() || INFLUXDB_URL_DEFAULT).replace(/\/$/, '');
}

export const ZALO_GRAPH_ME_URL_DEFAULT =
  'https://graph.zalo.me/v2.0/me?fields=id,name,picture';

export function resolveZaloGraphMeUrl(raw?: string): string {
  return raw?.trim() || ZALO_GRAPH_ME_URL_DEFAULT;
}

/** Endpoint giải mã số điện thoại Zalo Mini App (header access_token + code + secret_key). */
export const ZALO_GRAPH_PHONE_URL_DEFAULT = 'https://graph.zalo.me/v2.0/me/info';

export function resolveZaloGraphPhoneUrl(raw?: string): string {
  return raw?.trim() || ZALO_GRAPH_PHONE_URL_DEFAULT;
}
