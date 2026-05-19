# WebSocket Monitoring — Troubleshooting & Config Guide

> Mục tiêu: khắc phục lỗi `WebSocket connection to 'ws://<URL>/ws/monitoring/socket.io/?EIO=4&transport=websocket' failed: WebSocket is closed before the connection is established` ở UI `ConnectionStatusBanner` (banner đỏ "Mất kết nối — đang thử lại…").

## TL;DR — Setup local với docker compose

1. Tạo file `be/.env` (xem section [BE `.env`](#be-env)).
2. Tạo file `fe/.env` (xem section [FE `.env`](#fe-env)).
3. `cd be && docker compose up --build` — chờ tất cả service healthy.
4. `cd fe && docker compose up --build` — bundle FE đã có sẵn VITE_API_BASE_URL.
5. Mở `http://localhost:3000` (FE) hoặc `http://localhost:3006` (gateway HTTP).
6. Banner kết nối phải hiện **Đã kết nối** (xanh) sau ~1s.

---

## Lỗi đã được fix trong commit này

| Bug | File | Sửa |
|---|---|---|
| `corsOrigins` không được call (truyền function reference thay vì array) → socket.io reject mọi origin | `be/apps/monitoring-service/src/gateway/monitoring.gateway.ts` | Đổi `cors: { origin: corsOrigins, … }` → `cors: { origin: resolveWsCorsOrigin(), … }` (gọi `corsOrigins()` và fallback `true` cho dev) |
| `FE_ORIGINS` env không set trong `docker-compose.yml` cho monitoring-service (và các service khác) → CORS list rỗng | `be/docker-compose.yml` | Thêm `FE_ORIGINS` cho tất cả service (auth, farm, contract, monitoring, notification) với default cover localhost ports |
| Nginx ws location dùng `Connection ""` (kế thừa scope ngoài) → handshake không gửi `Upgrade: websocket` | `be/nginx/nginx.conf` | Override `proxy_set_header Connection "upgrade"` + `proxy_cache_bypass $http_upgrade` |

---

## BE `.env`

Tạo file `be/.env` (cùng cấp với `docker-compose.yml`). **Phải** có `JWT_SECRET` (auth + monitoring đều cần để verify token).

```dotenv
# ── Auth ──────────────────────────────────────────────────────────────
JWT_SECRET=trustagri-local-jwt-secret-min-32-chars-long-please-change
JWT_REFRESH_SECRET=trustagri-local-refresh-secret-different-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Dev login (để test nhanh không cần Zalo OAuth) ────────────────────
AUTH_DEV_LOGIN_ENABLED=true
DEV_LOGIN_SECRET=trustagri-dev-login-secret-min16
AUTH_PASSWORD_LOGIN_ENABLED=true

# ── Postgres ──────────────────────────────────────────────────────────
POSTGRES_USER=trustagri
POSTGRES_PASSWORD=trustagri_secret
POSTGRES_DB=trustagri
POSTGRES_PORT=5432

# ── Redis ─────────────────────────────────────────────────────────────
REDIS_PORT=6379

# ── InfluxDB ──────────────────────────────────────────────────────────
INFLUXDB_USERNAME=trustagri
INFLUXDB_PASSWORD=trustagri_secret
INFLUXDB_ORG=trustagri
INFLUXDB_BUCKET=sensor_data
INFLUXDB_TOKEN=trustagri-influx-token-replace-in-prod

# ── CORS / FE origins ─────────────────────────────────────────────────
# Comma-separated. Mặc định trong docker-compose đã cover các port local,
# nếu muốn thêm domain ngrok/dev khác thì set ở đây và compose sẽ pickup.
FE_ORIGINS=http://localhost:3000,http://localhost:3006,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3006

# ── Zalo OAuth (chỉ cần khi test mode zalo-oauth) ─────────────────────
ZALO_APP_ID=
ZALO_APP_SECRET=
```

> **Lưu ý**: `JWT_SECRET` phải **giống nhau** giữa `auth-service` (phát token) và `monitoring-service` (verify token cho WS handshake). Cả 2 đọc từ cùng file `be/.env` qua `env_file: .env` nên đảm bảo đúng.

---

## FE `.env`

Tạo file `fe/.env` (cùng cấp với `package.json`):

```dotenv
# Trỏ trực tiếp tới API gateway local (port 3006 do docker-compose map).
VITE_API_BASE_URL=http://localhost:3006/api/v1
VITE_API_CONTRACT_VERSION=5.0

# ── Auth mode ─────────────────────────────────────────────────────────
# 4 mode: zalo-oauth | zalo-token | dev-seeded | password
# Để test local nhanh nhất: dùng 'password' và đăng nhập bằng user đã seed,
# hoặc 'dev-seeded' với secret/zalo_id đã seed.
VITE_AUTH_MODE=dev-seeded
VITE_DEV_LOGIN_SECRET=trustagri-dev-login-secret-min16
VITE_DEV_LOGIN_ZALO_ID=zalo_dev_farmer_001
```

Nếu chạy FE local (không qua container, `npm run start`), Vite dev server lắng cổng `3000`. Bundle vẫn dùng `VITE_API_BASE_URL=http://localhost:3006/api/v1` để hit gateway.

> **Không** trỏ trực tiếp về port `3005` (monitoring-service). Browser hits gateway `3006`, gateway proxy lại `/ws/monitoring/*` về monitoring-service container.

---

## Kiểm tra hoạt động

### 1. Sau khi `docker compose up`

Tất cả service phải log:

```
[InfluxService] InfluxDB connection initialized
[MonitoringGateway] WebSocket gateway initialized
[Nest] Application is listening on port 3005
```

### 2. Check container CORS

```bash
docker logs trustagri-monitoring | grep -i cors
docker exec trustagri-monitoring env | grep FE_ORIGINS
```

Phải thấy `FE_ORIGINS=http://localhost:3000,...`.

### 3. Test handshake từ trình duyệt (DevTools → Network → WS)

URL phải là: `ws://localhost:3006/ws/monitoring/socket.io/?EIO=4&transport=websocket`

- Response: `101 Switching Protocols` → OK.
- Sau đó frames `40{"sid":"..."}` (engine.io handshake) → OK.
- Nếu thấy `400 Bad Request` hoặc connection close ngay → check token (xem §4 bên dưới).

### 4. Token không có hoặc invalid

`monitoringSocket.ts` (line 71-76) đọc token từ jotai store. Nếu token rỗng (chưa login), socket vẫn cố connect nhưng bị gateway middleware reject:

```
[afterInit] middleware returns Error('UNAUTHORIZED')
```

Fix: chỉ subscribe sau khi login thành công. Hook `useFarmDashboard` / `useFarmLiveSensors` đã wait token rồi mới gọi `subscribeToFarm`, nên đảm bảo user đăng nhập trước khi navigate vào màn giám sát.

### 5. Khi chạy FE qua Vite dev (port 3000, không build vào container)

```bash
cd fe
cp .env.example .env # rồi sửa như §FE .env
npm run start
```

Vite serve ở `http://localhost:3000`. Bundle vẫn hit `http://localhost:3006` cho API. WS connect tới gateway → monitoring-service. Nếu thấy CORS reject trên console, kiểm tra `FE_ORIGINS` trong `be/.env` có chứa `http://localhost:3000` không.

---

## Common pitfalls

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| `WebSocket is closed before connection established` | CORS reject (FE_ORIGINS rỗng) hoặc auth middleware reject (token thiếu/invalid) | Set `FE_ORIGINS` + đảm bảo login trước khi vào màn giám sát |
| Banner "Mất kết nối" hiện mãi | gateway nginx không bật WebSocket upgrade | Sửa `nginx.conf` (đã fix trong commit này) |
| `connect_error: timeout` lặp lại | monitoring-service container chưa healthy hoặc port 3005 không expose qua nginx | `docker compose ps`, check `trustagri-monitoring` log |
| `connect_error: server error` | `JWT_SECRET` ở monitoring ≠ auth-service | đảm bảo cùng `.env` chung; restart cả 2 |
| WS hoạt động nhưng không nhận `sensor_update` | Chưa có data trong InfluxDB | Xem `seed_influxdb.md` để seed data tay |

---

## Nội bộ — Cấu hình code liên quan

- **BE Gateway**: `be/apps/monitoring-service/src/gateway/monitoring.gateway.ts`
  - `path: '/ws/monitoring/socket.io/'`
  - `transports: ['websocket', 'polling']` (fallback nếu nginx không upgrade)
  - Auth middleware: extract Bearer token từ `socket.handshake.auth.token` hoặc header `authorization`.

- **FE Client**: `fe/src/api/monitoringSocket.ts`
  - Origin: `ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, '')`
  - Path khớp BE: `/ws/monitoring/socket.io/`
  - `auth: { token: 'Bearer ${jwt}' }`
  - Reconnect: exponential backoff 1s → 30s, retry infinity (NFR-A01).

- **Nginx**: `be/nginx/nginx.conf` — block `location /ws/monitoring` đã có Upgrade headers.

- **CORS helper**: `be/libs/shared/src/config/http.config.ts` → `corsOrigins()` đọc `process.env.FE_ORIGINS`.

---

Nếu sau khi áp dụng các bước trên vẫn còn lỗi, kiểm tra:
1. `docker compose down -v && docker compose up --build` (rebuild image vì `.env` baked vào FE bundle).
2. Hard refresh trình duyệt (Ctrl + Shift + R) để clear cache.
3. Kiểm tra ngày giờ máy local — JWT có exp; nếu lệch nhiều có thể bị "TokenExpiredError".
