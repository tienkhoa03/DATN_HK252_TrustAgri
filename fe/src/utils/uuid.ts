/**
 * UUID v4 (RFC 4122) — khớp ParseUUIDPipe version '4' phía Gateway / contract-service.
 */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string | undefined | null): boolean {
  if (value == null || typeof value !== 'string') return false;
  return UUID_V4.test(value.trim());
}
