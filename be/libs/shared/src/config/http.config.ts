/**
 * Parse FE_ORIGINS env var into an array of allowed CORS origins.
 * Example: FE_ORIGINS=https://zalo-miniapp.vn,https://staging.trustagri.vn
 */
export function corsOrigins(): string[] {
  return (process.env.FE_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
