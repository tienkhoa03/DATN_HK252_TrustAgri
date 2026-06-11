/**
 * Tùy chọn kết nối ioredis dựng từ env — dùng chung cho mọi service.
 *
 * Hai điểm bắt buộc cho Railway managed Redis (mà code cũ thiếu):
 *  - `password`: Railway Redis yêu cầu xác thực (env REDIS_PASSWORD). Thiếu → NOAUTH, mọi lệnh fail.
 *  - `family: 0`: host nội bộ `redis.railway.internal` chỉ phân giải IPv6. ioredis mặc định family=4
 *    nên không resolve được → connect treo. family:0 cho phép dual-stack (IPv4 local + IPv6 Railway).
 *    Đây là bản đối ứng phía outbound của fix `app.listen('::')` cho HTTP server.
 */
export interface RedisBaseOptions {
  host: string;
  port: number;
  password?: string;
  family: number;
}

export function redisOptionsFromEnv(): RedisBaseOptions {
  const options: RedisBaseOptions = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    family: 0,
  };
  const password = process.env.REDIS_PASSWORD?.trim();
  if (password) {
    options.password = password;
  }
  return options;
}
