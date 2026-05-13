# Thiết kế Redis — trích xuất từ mã nguồn TrustAgri

Tài liệu trả lời bốn nhóm câu hỏi về **quy ước key**, **TTL**, **eviction** và **Socket.io**, dựa trên code trong `be/` và `be/docker-compose.yml` (tháng 5/2026).

---

## 1. Cấu trúc Key (Key Naming Convention) thực tế

### 1.1. Chuỗi key–value (String cache / session)

| Mẫu key | Dịch vụ | Mục đích | Giá trị lưu |
|--------|---------|----------|-------------|
| `session:{accessToken}` | auth-service | Phiên đăng nhập (đối chiếu khi `verify`) | JSON `{ userId, role }` — token ở đây là **JWT access**, không phải Zalo token |
| `ratelimit:dev-login:{clientIp}` | auth-service | Rate limit endpoint dev-login | Bộ đếm số request (INCR) |
| `farm:{farmId}:sensor:{sensorType}` | monitoring-service | Đọc nhanh reading mới nhất theo loại cảm biến | JSON `SensorReadingDto` |
| `dashboard:trader:{userId}` | contract-service | Cache dashboard thương lái | JSON `DashboardTraderDto` |
| `dashboard:farmer:{userId}` | contract-service | Cache dashboard nông dân | JSON `DashboardFarmerDto` |
| `dashboard:buyer:{userId}` | contract-service | Cache dashboard người mua | JSON `DashboardBuyerDto` |
| `compliance:v1:{contractId}` | contract-service | Cache kết quả đối chiếu tuân thủ hợp đồng | JSON `ComplianceDto` |

`userId` / `user.sub` trong dashboard là **JWT subject** (chuỗi user id), khớp cách build key trong `dashboard.service.ts`.

**Không thấy trong code:**

- Key dạng `auth:zalo_token:{user_id}` — **Zalo access token không được cache Redis**; luồng login dùng Zalo ở tầng xác thực, session ứng dụng là JWT + Redis như bảng trên.
- Key kiểu `standards:list`, `forecasts:{region}` — **không** có implementation Redis cho các endpoint đó trong repo hiện tại.

### 1.2. Redis Pub/Sub (kênh — không phải key lưu trữ)

Các chuỗi sau là **tên channel** (`PUBLISH` / `SUBSCRIBE`), không dùng TTL:

| Channel | Publisher | Subscriber (trong code) |
|---------|-----------|-------------------------|
| `alert.created` | monitoring-service (`AlertPublisherService`) | notification-service |
| `contract.changed` | contract-service (`ContractEventPublisherService`) | notification-service |
| `connection.requested` | contract-service (`ConnectionPublisherService`) | notification-service |
| `connection.updated` | contract-service (cùng service) | **Chưa** thấy `notification-service` subscribe channel này (chỉ subscribe 3 channel kia) |

---

## 2. TTL (Time to Live) — con số trong mã

| Loại dữ liệu | TTL | Nguồn |
|--------------|-----|--------|
| Reading cảm biến mới nhất (`farm:...:sensor:...`) | **300 giây (5 phút)** | `RedisSensorService.setReading` — tham số mặc định `ttlSeconds = 300` |
| Session `session:{accessToken}` | **Đúng bằng thời hạn access JWT** (`exp - iat` giây) | `AuthService.issueSessionForUser` — decode JWT để lấy TTL |
| Access JWT mặc định | **`JWT_EXPIRES_IN` mặc định `15m`** (auth-service / shared config) | `app.module.ts` + `database.config.ts` — session Redis ~ 15 phút nếu không đổi env |
| Refresh JWT | **`JWT_REFRESH_EXPIRES_IN` mặc định `7d`** | Dùng khi ký refresh token; **key Redis session gắn với access token**, không phải refresh |
| Dashboard cache (`dashboard:...`) | **120 giây (2 phút)** | `DASHBOARD_TTL_SEC = 120` trong `dashboard.service.ts` |
| Compliance cache (`compliance:v1:...`) | **300 giây (5 phút)** | `COMPLIANCE_CACHE_TTL_SEC = 300` trong `compliance.service.ts` |
| Rate limit dev-login (`ratelimit:dev-login:{ip}`) | **60 giây** | `windowSec = 60` trong `devLogin`; `incrWithTtl` set `EXPIRE` ở lần INCR đầu |

Pub/Sub: message không lưu trong keyspace — **không có TTL** theo nghĩa key-value.

---

## 3. Chính sách Eviction (Redis đầy bộ nhớ)

**Trong `be/docker-compose.yml`, service Redis chạy:**

```yaml
command: redis-server --appendonly yes
```

- **Không** set `maxmemory`.
- **Không** set `maxmemory-policy`.

Hành vi mặc định Redis: khi **không** giới hạn `maxmemory`, instance có thể dùng RAM theo nhu cầu OS; **không kích hoạt eviction** theo LRU. Nếu đặt `maxmemory` sau này:

- Cache có TTL (sensor, dashboard, compliance, session, rate limit) phù hợp **`volatile-lru`** hoặc **`allkeys-lru`** tùy có muốn xóa cả key không TTL hay không.
- **Đây là hướng dự kiến**, không phải cấu hình đã ghi trong repo.

---

## 4. Redis với Socket.io (scale nhiều instance)

- **Monitoring** dùng `@nestjs/websockets` + `socket.io` (`MonitoringGateway`, namespace `/ws/monitoring`).
- **Không** có dependency `@socket.io/redis-adapter` (hay tương đương) trong `monitoring-service/package.json`.
- **Không** có mã khởi tạo `RedisAdapter` cho `Server` trong `monitoring.gateway.ts`.

**Kết luận:** hiện tại WebSocket **chạy in-process**; broadcast `pushSensorUpdate` chỉ tới client gắn **cùng một process**. Để scale ngang nhiều instance monitoring-service, cần bổ sung **Socket.io Redis adapter** (hoặc sticky session + cơ chế fan-out khác) — **chưa triển khai** trong mã nguồn này.

---

## Tóm tắt nhanh

| Chủ đề | Thực tế trong repo |
|--------|-------------------|
| Key chính | `session:*`, `ratelimit:dev-login:*`, `farm:*:sensor:*`, `dashboard:{role}:*`, `compliance:v1:*` |
| Zalo token trong Redis | Không |
| Cache standards / forecasts | Không |
| TTL cảm biến | 5 phút |
| TTL session | Theo access JWT (mặc định 15 phút) |
| TTL dashboard / compliance | 2 phút / 5 phút |
| Eviction | Chưa cấu hình; Docker chỉ AOF |
| Socket.io + Redis adapter | Không dùng |

**Ghi chú tài liệu:** Comment trong `FarmAccessGuard` có câu “phụ thuộc vào cache Redis” khi contract-service lỗi; implementation hiện **gọi HTTP** và fail-closed, **không** đọc Redis cho bước kiểm tra quyền — nếu trích dẫn guard trong báo cáo, nên ưu tiên mô tả theo hành vi thực tế (HTTP + exception).
