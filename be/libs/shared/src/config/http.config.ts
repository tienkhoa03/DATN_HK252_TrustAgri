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

/**
 * Trả về giá trị `origin` cho NestJS `enableCors`:
 * - Nếu FE_ORIGINS có giá trị: trả mảng whitelist.
 * - Nếu FE_ORIGINS rỗng (vd: dev local quên set): trả `true` để allow mọi origin
 *   (an toàn ở dev — vẫn yêu cầu CSRF/JWT cho endpoint nhạy cảm).
 * Pattern này tránh tình trạng `origin: []` → CORS reject mọi request.
 */
export function corsOriginsOrAllowAll(): boolean | string[] {
  const list = corsOrigins();
  return list.length > 0 ? list : true;
}
