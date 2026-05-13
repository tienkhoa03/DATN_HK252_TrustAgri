# Thiết kế cơ sở dữ liệu PostgreSQL / PostgREST (theo mã nguồn TrustAgri)

## ORM trong NestJS

Dự án sử dụng **TypeORM** (`typeorm` + `@nestjs/typeorm`), kết nối **PostgreSQL** (`type: 'postgres'` trong cấu hình `TypeOrmModule.forRootAsync`). Không dùng Prisma hay Sequelize cho các thực thể dưới đây.

**PostgREST:** Khi expose API qua PostgREST, các bảng dưới đây giả định nằm trong schema mặc định **`public`** (hoặc schema bạn cấu hình trong `db-schemas`). Danh sách bảng lấy từ toàn bộ file `*.entity.ts` có `@Entity('...')` trong monorepo backend.

**Lưu ý kiểu dữ liệu:** Cột chuỗi không khai báo `length` thường ánh xạ `character varying` (mặc định 255) khi `synchronize` tạo bảng. `@PrimaryGeneratedColumn('uuid')` → **`uuid`**. `@CreateDateColumn` / `@UpdateDateColumn` mặc định → **`timestamp`** (PostgreSQL: `timestamp without time zone`) trừ khi khai báo `type: 'timestamptz'`. Các microservice có thể dùng chung một database `POSTGRES_DB` (ví dụ `trustagri`); ràng buộc FK xuyên service một phần chỉ được ghi chú trong code, không phải lúc nào cũng có FK vật lý trong DB.

---

## Danh sách đầy đủ bảng PostgreSQL (`@Entity`)

| Bảng | Service (app) | File entity |
|------|---------------|-------------|
| `alerts` | monitoring-service | `be/apps/monitoring-service/src/alerts/alert.entity.ts` |
| `buying_requests` | contract-service | `be/apps/contract-service/src/buying-requests/entities/buying-request.entity.ts` |
| `care_logs` | farm-service | `be/apps/farm-service/src/care-logs/entities/care-log.entity.ts` |
| `connections` | contract-service | `be/apps/contract-service/src/connections/entities/connection.entity.ts` |
| `contract_audit_logs` | contract-service | `be/apps/contract-service/src/contracts/entities/contract-audit-log.entity.ts` |
| `contract_change_requests` | contract-service | `be/apps/contract-service/src/contract-change-requests/entities/contract-change-request.entity.ts` |
| `contracts` | contract-service | `be/apps/contract-service/src/contracts/entities/contract.entity.ts` |
| `evidences` | farm-service | `be/apps/farm-service/src/care-logs/entities/evidence.entity.ts` |
| `farms` | farm-service | `be/apps/farm-service/src/farms/entities/farm.entity.ts` |
| `forecasts` | notification-service | `be/apps/notification-service/src/forecasts/forecast.entity.ts` |
| `iot_devices` | monitoring-service | `be/apps/monitoring-service/src/devices/entities/iot-device.entity.ts` |
| `news_articles` | notification-service | `be/apps/notification-service/src/news/news-article.entity.ts` |
| `notifications` | notification-service | `be/apps/notification-service/src/notifications/notification.entity.ts` |
| `orders` | contract-service | `be/apps/contract-service/src/orders/entities/order.entity.ts` |
| `products` | contract-service | `be/apps/contract-service/src/products/entities/product.entity.ts` |
| `proposals` | contract-service | `be/apps/contract-service/src/proposals/entities/proposal.entity.ts` |
| `sensor_devices` | monitoring-service | `be/apps/monitoring-service/src/sensors/sensor-device.entity.ts` |
| `standard_steps` | farm-service | `be/apps/farm-service/src/standards/entities/standard-step.entity.ts` |
| `standards` | farm-service | `be/apps/farm-service/src/standards/entities/standard.entity.ts` |
| `trader_reviews` | contract-service | `be/apps/contract-service/src/trader-reviews/entities/trader-review.entity.ts` |
| `users` | auth-service | `be/apps/auth-service/src/auth/entities/user.entity.ts` |

**Tổng: 21 bảng** (theo số entity TypeORM trong repo tại thời điểm cập nhật tài liệu).

### Ánh xạ tên khái niệm (tài liệu cũ)

| Tên khái niệm | Bảng |
|---------------|------|
| Users | `users` |
| Farm_Lab | `farms` |
| Contracts | `contracts` |
| Standard_Process | `standards` + `standard_steps` |
| Farming_Logs | `care_logs` |

---

## Bảng cột (chuẩn hoá cho LaTeX / PostgREST)

**Tên cột** theo `name` trong decorator hoặc property; **kiểu** theo entity; **NULL / UNIQUE / PK**; **ghi chú** (CHECK, index, quan hệ).

### `alerts`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `farm_id` | `varchar` | NOT NULL | | index; FK logic → `farms` |
| `sensor_type` | `varchar` | NOT NULL | | |
| `severity` | `varchar` | NOT NULL | | `@Check` `'warning' \| 'danger'` |
| `threshold` | `float` | NOT NULL | | `@Check` theo `sensor_type` (khoảng giá trị) |
| `value` | `float` | NOT NULL | | `@Check` theo `sensor_type` |
| `suggested_action` | `text` | NULL | | |
| `acknowledged` | `boolean` | NOT NULL | | default `false`; index |
| `acknowledged_by` | `varchar` | NULL | | FK logic → `users` |
| `acknowledged_at` | `timestamptz` | NULL | | |
| `created_at` | `timestamptz` | NOT NULL | | `@CreateDateColumn` |

### `buying_requests`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `buyer_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `crop_type` | `varchar` | NOT NULL | | |
| `quantity` | `numeric(15,3)` | NOT NULL | | `@Check` > 0 |
| `unit` | `varchar` | NOT NULL | | |
| `quality_standard_code` | `varchar` | NULL | | |
| `expected_price` | `numeric(15,2)` | NULL | | `@Check` >= 0 nếu không NULL |
| `deposit_offered` | `numeric(15,2)` | NULL | | `@Check` >= 0 nếu không NULL |
| `delivery_date` | `date` | NOT NULL | | |
| `status` | `varchar(20)` | NOT NULL | | index; default `'open'`; `@Check` `'open' \| 'matched' \| 'closed'` |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | soft delete |

### `care_logs`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `farm_id` | `uuid` (FK) | NOT NULL | | index; FK → `farms`, `ON DELETE CASCADE` |
| `standard_step_id` | `varchar` | NULL | | index; FK → `standard_steps`, `ON DELETE SET NULL` |
| `action` | `varchar` | NOT NULL | | |
| `notes` | `text` | NULL | | |
| `performed_at` | `timestamptz` | NOT NULL | | index |
| `deviation` | `boolean` | NULL | | default `false` |
| `sync_status` | `varchar` | NOT NULL | | default `'synced'`; `@Check` `'synced' \| 'pending' \| 'conflict'` |
| `client_record_id` | `varchar` | NULL | UNIQUE | |
| `performed_by` | `varchar` | NULL | | index; FK logic → `users` |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |

### `connections`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `from_user_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `to_user_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `from_role` | `varchar` | NOT NULL | | `@Check` `'farmer' \| 'trader'` |
| `to_role` | `varchar` | NOT NULL | | `@Check` `'farmer' \| 'trader'` |
| `farm_id` | `varchar` | NULL | | index; FK logic → `farms` |
| `message` | `text` | NULL | | |
| `status` | `varchar` | NOT NULL | | index; default `'pending'`; `@Check` trạng thái kết nối |
| `created_at` | `timestamp` | NOT NULL | | |
| `responded_at` | `timestamptz` | NULL | | |
| `deleted_at` | `timestamp` | NULL | | soft delete |

*CHECK bổ sung trên bảng:* `from_user_id <> to_user_id`; các `@Check` cho `status`, `from_role`, `to_role` như trong entity.

### `contract_audit_logs`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `contract_id` | `varchar` | NOT NULL | | index; FK → `contracts`, `ON DELETE CASCADE` |
| `previous_status` | `varchar(32)` | NULL | | |
| `new_status` | `varchar(32)` | NOT NULL | | |
| `actor_user_id` | `varchar` | NULL | | index; FK logic → `users` |
| `occurred_at` | `timestamp` | NOT NULL | | index; `@CreateDateColumn` |

### `contract_change_requests`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `contract_id` | `varchar` | NOT NULL | | index; FK → `contracts`, `ON DELETE CASCADE` |
| `requested_by` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `changes` | `jsonb` | NOT NULL | | |
| `reason` | `text` | NULL | | |
| `status` | `varchar(20)` | NOT NULL | | `@Check` `'pending' \| 'accepted' \| 'rejected'` |
| `responded_by` | `varchar` | NULL | | FK logic → `users` |
| `responded_at` | `timestamptz` | NULL | | |
| `created_at` | `timestamp` | NOT NULL | | |

### `contracts`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `party_farmer_id` | `varchar` | NULL | | index; FK logic → `users` |
| `party_trader_id` | `varchar` | NOT NULL | | index |
| `party_buyer_id` | `varchar` | NULL | | index |
| `contract_type` | `varchar(20)` | NOT NULL | | `@Check` `'farmer_trader' \| 'trader_buyer'` |
| `product_id` | `varchar` | NULL | | index; FK → `products`, `ON DELETE SET NULL` |
| `standard_id` | `varchar` | NULL | | FK logic → `standards` |
| `farm_id` | `varchar` | NULL | | index; FK logic → `farms` |
| `quantity` | `numeric(15,3)` | NOT NULL | | `@Check` > 0 |
| `unit` | `varchar` | NOT NULL | | |
| `total_price` | `numeric(15,2)` | NOT NULL | | `@Check` >= 0 |
| `deposit` | `numeric(15,2)` | NULL | | `@Check` với `total_price` |
| `start_date` | `date` | NOT NULL | | |
| `end_date` | `date` | NOT NULL | | `@Check` >= `start_date` |
| `status` | `varchar(20)` | NOT NULL | | index; default `'active'`; `@Check` tập trạng thái |
| `terms` | `text` | NOT NULL | | default `''` |
| `order_id` | `varchar` | NULL | | index; FK → `orders`, `ON DELETE SET NULL` |
| `proposal_id` | `varchar` | NULL | | FK → `proposals`, `ON DELETE SET NULL` |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `evidences`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `care_log_id` | `uuid` (FK) | NOT NULL | | index; FK → `care_logs`, `ON DELETE CASCADE` |
| `file_url` | `text` | NOT NULL | | |
| `mime_type` | `varchar` | NOT NULL | | |
| `captured_at` | `timestamptz` | NOT NULL | | |
| `created_at` | `timestamp` | NOT NULL | | |

### `farms`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `owner_id` | `varchar` | NOT NULL | | index; FK logic → `users.user_id` |
| `name` | `varchar` | NOT NULL | | |
| `location` | `jsonb` | NOT NULL | | `FarmLocation` |
| `area` | `float` | NOT NULL | | `@Check` > 0 |
| `crop_type` | `varchar` | NOT NULL | | |
| `standard_id` | `uuid` (FK) | NULL | | index; FK → `standards`, `ON DELETE SET NULL` |
| `planting_date` | `date` | NULL | | |
| `traceability_code` | `varchar` | NULL | UNIQUE | |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | soft delete |

### `forecasts`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `trader_id` | `uuid` | NOT NULL | | index; FK logic → `users` |
| `region` | `varchar(128)` | NOT NULL | | index |
| `crop_type` | `varchar(128)` | NOT NULL | | |
| `type` | `varchar(32)` | NOT NULL | | `@Check` `'price' \| 'demand' \| 'weather'` |
| `forecast_data` | `jsonb` | NOT NULL | | |
| `valid_from` | `timestamptz` | NOT NULL | | |
| `valid_to` | `timestamptz` | NOT NULL | | `@Check` > `valid_from` |
| `created_at` | `timestamptz` | NOT NULL | | |
| `updated_at` | `timestamptz` | NOT NULL | | |
| `deleted_at` | `timestamptz` | NULL | | |

### `iot_devices`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `farm_id` | `uuid` | NOT NULL | | index; FK logic → `farms` |
| `name` | `varchar(128)` | NOT NULL | | |
| `status` | `varchar(16)` | NOT NULL | | default `'offline'`; `@Check` `'online' \| 'offline'` |
| `battery_level` | `int` | NULL | | |
| `sensor_types` | `text[]` | NOT NULL | | mảng chuỗi PostgreSQL |
| `firmware_version` | `varchar(32)` | NULL | | |
| `last_seen_at` | `timestamptz` | NULL | | |
| `created_at` | `timestamptz` | NOT NULL | | |
| `updated_at` | `timestamptz` | NOT NULL | | |
| `deleted_at` | `timestamptz` | NULL | | soft delete |

### `news_articles`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `trader_id` | `uuid` | NOT NULL | | index; FK logic → `users` |
| `title` | `varchar(512)` | NOT NULL | | |
| `summary` | `text` | NOT NULL | | |
| `content` | `text` | NOT NULL | | |
| `category` | `varchar(128)` | NOT NULL | | |
| `image_url` | `varchar(2048)` | NULL | | |
| `published_at` | `timestamptz` | NOT NULL | | index |
| `created_at` | `timestamptz` | NOT NULL | | |
| `updated_at` | `timestamptz` | NOT NULL | | |
| `deleted_at` | `timestamptz` | NULL | | |

### `notifications`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `user_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `type` | `varchar(32)` | NOT NULL | | `@Check` `'alert' \| 'contract' \| 'connection' \| 'system'` |
| `title` | `varchar` | NOT NULL | | |
| `body` | `text` | NOT NULL | | |
| `severity` | `varchar(16)` | NULL | | `@Check` `'info' \| 'warning' \| 'danger'` nếu không NULL |
| `link_to` | `varchar(1024)` | NULL | | |
| `read` | `boolean` | NOT NULL | | default `false`; index (tên cột `read`) |
| `read_at` | `timestamptz` | NULL | | |
| `created_at` | `timestamptz` | NOT NULL | | |

### `orders`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `buyer_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `trader_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `product_id` | `uuid` (FK) | NOT NULL | | index; FK → `products`, `ON DELETE RESTRICT` |
| `quantity` | `numeric(15,3)` | NOT NULL | | `@Check` > 0 |
| `unit` | `varchar` | NOT NULL | | |
| `total_price` | `numeric(15,2)` | NOT NULL | | `@Check` >= 0 |
| `deposit` | `numeric(15,2)` | NULL | | `@Check` với `total_price` |
| `status` | `varchar(20)` | NOT NULL | | index; default `'pending'`; `@Check` tập trạng thái đơn |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `products`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `trader_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `farm_id` | `varchar` | NULL | | index; FK logic → `farms` |
| `name` | `varchar` | NOT NULL | | |
| `crop_type` | `varchar` | NOT NULL | | |
| `unit` | `varchar` | NOT NULL | | |
| `price` | `numeric(15,2)` | NOT NULL | | `@Check` >= 0 |
| `currency` | `varchar(10)` | NOT NULL | | default `'VND'` |
| `images` | `jsonb` | NOT NULL | | default `[]` |
| `standard_code` | `varchar` | NULL | | |
| `stock_quantity` | `int` | NULL | | `@Check` >= 0 nếu không NULL |
| `description` | `text` | NULL | | |
| `status` | `varchar(20)` | NOT NULL | | index; default `'active'`; `@Check` `'active' \| 'inactive'` |
| `created_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `proposals`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `buying_request_id` | `uuid` (FK) | NOT NULL | | index; FK → `buying_requests`, `ON DELETE CASCADE` |
| `trader_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `price` | `numeric(15,2)` | NOT NULL | | `@Check` > 0 |
| `quantity` | `numeric(15,3)` | NOT NULL | | `@Check` > 0 |
| `standard_code` | `varchar` | NULL | | |
| `note` | `text` | NULL | | |
| `status` | `varchar(20)` | NOT NULL | | index; default `'pending'`; `@Check` `'pending' \| 'accepted' \| 'rejected'` |
| `created_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `sensor_devices`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `farm_id` | `uuid` | NOT NULL | | index; FK logic → `farms` |
| `device_id` | `varchar(64)` | NOT NULL | UNIQUE | |
| `mac_address` | `macaddr` | NOT NULL | UNIQUE | kiểu PostgreSQL `macaddr` |
| `sensor_type` | `varchar(32)` | NOT NULL | | `@Check` `'temperature' \| 'humidity' \| 'light' \| 'soil_moisture'` |
| `firmware_version` | `varchar(32)` | NULL | | |
| `is_active` | `boolean` | NOT NULL | | default `true` |
| `last_seen_at` | `timestamptz` | NULL | | |
| `created_at` | `timestamptz` | NOT NULL | | |
| `updated_at` | `timestamptz` | NOT NULL | | |

### `standard_steps`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `standard_id` | `uuid` (FK) | NOT NULL | | FK → `standards`, `ON DELETE CASCADE` |
| `order` | `int` | NOT NULL | | |
| `title` | `varchar` | NOT NULL | | |
| `description` | `text` | NOT NULL | | |
| `expected_duration_days` | `int` | NULL | | |
| `acceptance_criteria` | `text` | NULL | | |

### `standards`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `code` | `varchar` | NOT NULL | UNIQUE | |
| `name` | `varchar` | NOT NULL | | |
| `description` | `text` | NOT NULL | | |
| `crop_type` | `varchar(128)` | NULL | | index |
| `version` | `int` | NOT NULL | | default `1` |
| `owner_trader_id` | `varchar` | NULL | | index; FK logic → `users` |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `trader_reviews`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `id` | `uuid` | NOT NULL | PK | |
| `trader_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `buyer_id` | `varchar` | NOT NULL | | index; FK logic → `users` |
| `order_id` | `uuid` | NULL | | FK → `orders`; unique composite `(buyer_id, order_id)` trong dev sync (xem comment entity) |
| `rating` | `int` | NOT NULL | | `@Check` BETWEEN 1 AND 5 |
| `comment` | `text` | NULL | | |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | |

### `users`

| Cột | Kiểu | NULL | UNIQUE / PK | Ghi chú |
|-----|------|------|-------------|---------|
| `user_id` | `uuid` | NOT NULL | PK | |
| `zalo_id` | `varchar` | NOT NULL | UNIQUE | |
| `role` | enum | NOT NULL | | default `'guest'` |
| `display_name` | `varchar` | NOT NULL | | |
| `phone` | `varchar` | NULL | | |
| `email` | `varchar` | NULL | | |
| `avatar_url` | `varchar` | NULL | | |
| `trader_profile` | `jsonb` | NULL | | |
| `farmer_profile` | `jsonb` | NULL | | |
| `buyer_profile` | `jsonb` | NULL | | |
| `created_at` | `timestamp` | NOT NULL | | |
| `updated_at` | `timestamp` | NOT NULL | | |
| `deleted_at` | `timestamp` | NULL | | soft delete |
| `last_login` | `timestamptz` | NULL | | |
| `username` | `varchar` | NULL | UNIQUE | |
| `password_hash` | `varchar` | NULL | | |

---

## Sao chép định nghĩa entity (TypeScript)

Dưới đây là mã nguồn entity trong repo. Bảng cột ở trên là bản tóm tắt; khi lệch với migration SQL thủ công, ưu tiên migration.

### `AlertEntity` — `be/apps/monitoring-service/src/alerts/alert.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('alerts')
@Check(`"severity" IN ('warning', 'danger')`)
@Check('"threshold" >= 0')
@Check(`
  ("sensor_type" = 'humidity'      AND "value" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'soil_moisture' AND "value" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'temperature'   AND "value" BETWEEN -50 AND 60)   OR
  ("sensor_type" = 'light'         AND "value" BETWEEN 0 AND 200000) OR
  "sensor_type" NOT IN ('humidity', 'soil_moisture', 'temperature', 'light')
`)
@Check(`
  ("sensor_type" = 'humidity'      AND "threshold" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'soil_moisture' AND "threshold" BETWEEN 0 AND 100)    OR
  ("sensor_type" = 'temperature'   AND "threshold" BETWEEN -50 AND 60)   OR
  ("sensor_type" = 'light'         AND "threshold" BETWEEN 0 AND 200000) OR
  "sensor_type" NOT IN ('humidity', 'soil_moisture', 'temperature', 'light')
`)
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_alerts_farm_id')
  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'sensor_type' })
  sensorType: string;

  @Column()
  severity: 'warning' | 'danger';

  @Column({ type: 'float' })
  threshold: number;

  @Column({ type: 'float' })
  value: number;

  @Column({ name: 'suggested_action', type: 'text', nullable: true })
  suggestedAction?: string;

  @Index('idx_alerts_acknowledged')
  @Column({ default: false })
  acknowledged: boolean;

  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

### `BuyingRequestEntity` — `be/apps/contract-service/src/buying-requests/entities/buying-request.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BuyingRequestStatus = 'open' | 'matched' | 'closed';

@Entity('buying_requests')
@Check('"quantity" > 0')
@Check('"expected_price" IS NULL OR "expected_price" >= 0')
@Check('"deposit_offered" IS NULL OR "deposit_offered" >= 0')
@Check(`"status" IN ('open', 'matched', 'closed')`)
export class BuyingRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_buying_requests_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'quality_standard_code', nullable: true, type: 'varchar' })
  qualityStandardCode: string | null;

  @Column({
    name: 'expected_price',
    nullable: true,
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  expectedPrice: number | null;

  @Column({
    name: 'deposit_offered',
    nullable: true,
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  depositOffered: number | null;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate: string;

  @Index('idx_buying_requests_status')
  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: BuyingRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `CareLogEntity` — `be/apps/farm-service/src/care-logs/entities/care-log.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvidenceEntity } from './evidence.entity';
import { FarmEntity } from '../../farms/entities/farm.entity';
import { StandardStepEntity } from '../../standards/entities/standard-step.entity';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

@Entity('care_logs')
@Check(`"sync_status" IN ('synced', 'pending', 'conflict')`)
export class CareLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_care_logs_farm_id')
  @Column({ name: 'farm_id' })
  farmId: string;

  @ManyToOne(() => FarmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: FarmEntity;

  @Index('idx_care_logs_standard_step_id')
  @Column({ name: 'standard_step_id', nullable: true, type: 'varchar' })
  standardStepId: string | null;

  @ManyToOne(() => StandardStepEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'standard_step_id' })
  standardStep: StandardStepEntity | null;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index('idx_care_logs_performed_at')
  @Column({ name: 'performed_at', type: 'timestamptz' })
  performedAt: Date;

  @Column({ type: 'boolean', nullable: true, default: false })
  deviation: boolean | null;

  @Column({ name: 'sync_status', type: 'varchar', default: 'synced' })
  syncStatus: SyncStatus;

  @Column({ name: 'client_record_id', nullable: true, type: 'varchar', unique: true })
  clientRecordId: string | null;

  @Index('idx_care_logs_performed_by')
  @Column({ name: 'performed_by', nullable: true, type: 'varchar' })
  performedBy: string | null;

  @OneToMany(() => EvidenceEntity, (e) => e.careLog, { cascade: true, eager: false })
  evidences: EvidenceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### `ConnectionEntity` — `be/apps/contract-service/src/connections/entities/connection.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'signed';
export type ConnectionRole = 'farmer' | 'trader';

@Entity('connections')
@Check('"from_user_id" <> "to_user_id"')
@Check(`"status" IN ('pending', 'accepted', 'rejected', 'negotiating', 'signed')`)
@Check(`"from_role" IN ('farmer', 'trader')`)
@Check(`"to_role" IN ('farmer', 'trader')`)
export class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_connections_from_user_id')
  @Column({ name: 'from_user_id' })
  fromUserId: string;

  @Index('idx_connections_to_user_id')
  @Column({ name: 'to_user_id' })
  toUserId: string;

  @Column({ name: 'from_role', type: 'varchar' })
  fromRole: ConnectionRole;

  @Column({ name: 'to_role', type: 'varchar' })
  toRole: ConnectionRole;

  @Index('idx_connections_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Index('idx_connections_status')
  @Column({ type: 'varchar', default: 'pending' })
  status: ConnectionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `ContractAuditLogEntity` — `be/apps/contract-service/src/contracts/entities/contract-audit-log.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('contract_audit_logs')
export class ContractAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_cal_contract_id')
  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @ManyToOne(() => ContractEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;

  @Column({ name: 'previous_status', type: 'varchar', length: 32, nullable: true })
  previousStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 32 })
  newStatus: string;

  @Index('idx_cal_actor_user_id')
  @Column({ name: 'actor_user_id', type: 'varchar', nullable: true })
  actorUserId: string | null;

  @Index('idx_cal_occurred_at')
  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
```

### `ContractChangeRequestEntity` — `be/apps/contract-service/src/contract-change-requests/entities/contract-change-request.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContractEntity } from '../../contracts/entities/contract.entity';

@Entity('contract_change_requests')
@Check(`"status" IN ('pending', 'accepted', 'rejected')`)
export class ContractChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_ccr_contract_id')
  @Column({ name: 'contract_id', type: 'varchar' })
  contractId: string;

  @ManyToOne(() => ContractEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;

  @Index('idx_ccr_requested_by')
  @Column({ name: 'requested_by', type: 'varchar' })
  requestedBy: string;

  @Column({ type: 'jsonb' })
  changes: Record<string, { oldValue: unknown; newValue: unknown }>;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: 'pending' | 'accepted' | 'rejected';

  @Column({ name: 'responded_by', type: 'varchar', nullable: true })
  respondedBy: string | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### `ContractEntity` — `be/apps/contract-service/src/contracts/entities/contract.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from '../../orders/entities/order.entity';
import { ProposalEntity } from '../../proposals/entities/proposal.entity';
import { ProductEntity } from '../../products/entities/product.entity';

export type ContractStatus =
  | 'pending_signature'
  | 'active'
  | 'pending_change'
  | 'in_settlement'
  | 'completed'
  | 'cancelled';
export type ContractType = 'farmer_trader' | 'trader_buyer';

@Entity('contracts')
@Check('"quantity" > 0')
@Check('"total_price" >= 0')
@Check('"deposit" IS NULL OR "deposit" >= 0')
@Check('"deposit" IS NULL OR "deposit" <= "total_price"')
@Check(`"status" IN ('pending_signature', 'active', 'pending_change', 'in_settlement', 'completed', 'cancelled')`)
@Check(`"contract_type" IN ('farmer_trader', 'trader_buyer')`)
@Check('"end_date" >= "start_date"')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_contracts_party_farmer_id')
  @Column({ name: 'party_farmer_id', nullable: true, type: 'varchar' })
  partyFarmerId: string | null;

  @Index('idx_contracts_party_trader_id')
  @Column({ name: 'party_trader_id' })
  partyTraderId: string;

  @Index('idx_contracts_party_buyer_id')
  @Column({ name: 'party_buyer_id', nullable: true, type: 'varchar' })
  partyBuyerId: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 20 })
  contractType: ContractType;

  @Index('idx_contracts_product_id')
  @Column({ name: 'product_id', nullable: true, type: 'varchar' })
  productId: string | null;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null;

  @Column({ name: 'standard_id', nullable: true, type: 'varchar' })
  standardId: string | null;

  @Index('idx_contracts_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'total_price', type: 'numeric', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  deposit: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Index('idx_contracts_status')
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ContractStatus;

  @Column({ type: 'text', default: '' })
  terms: string;

  @Index('idx_contracts_order_id')
  @Column({ name: 'order_id', nullable: true, type: 'varchar' })
  orderId: string | null;

  @ManyToOne(() => OrderEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity | null;

  @Column({ name: 'proposal_id', nullable: true, type: 'varchar' })
  proposalId: string | null;

  @ManyToOne(() => ProposalEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposal_id' })
  proposal: ProposalEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `EvidenceEntity` — `be/apps/farm-service/src/care-logs/entities/evidence.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CareLogEntity } from './care-log.entity';

@Entity('evidences')
export class EvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_evidences_care_log_id')
  @Column({ name: 'care_log_id' })
  careLogId: string;

  @ManyToOne(() => CareLogEntity, (cl) => cl.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'care_log_id' })
  careLog: CareLogEntity;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### `FarmEntity` — `be/apps/farm-service/src/farms/entities/farm.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StandardEntity } from '../../standards/entities/standard.entity';

export interface FarmLocation {
  province: string;
  district: string;
  addressLine: string;
  lat?: number;
  lng?: number;
}

@Entity('farms')
@Check('"area" > 0')
export class FarmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_farms_owner_id')
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  location: FarmLocation;

  @Column({ type: 'float' })
  area: number;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Index('idx_farms_standard_id')
  @Column({ name: 'standard_id', nullable: true })
  standardId: string | null;

  @ManyToOne(() => StandardEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'standard_id' })
  standard: StandardEntity | null;

  @Column({ name: 'planting_date', type: 'date', nullable: true })
  plantingDate: string | null;

  @Column({ name: 'traceability_code', nullable: true, unique: true })
  traceabilityCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
```

### `ForecastEntity` — `be/apps/notification-service/src/forecasts/forecast.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forecasts')
@Check(`"type" IN ('price', 'demand', 'weather')`)
@Check('"valid_to" > "valid_from"')
export class ForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_forecasts_trader_id')
  @Column({ name: 'trader_id', type: 'uuid' })
  traderId: string;

  @Index('idx_forecasts_region')
  @Column({ type: 'varchar', length: 128 })
  region: string;

  @Column({ name: 'crop_type', type: 'varchar', length: 128 })
  cropType: string;

  @Column({ type: 'varchar', length: 32 })
  type: 'price' | 'demand' | 'weather';

  @Column({ name: 'forecast_data', type: 'jsonb' })
  forecastData: unknown;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamptz' })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
```

### `IotDeviceEntity` — `be/apps/monitoring-service/src/devices/entities/iot-device.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IotDeviceStatus } from '@trustagri/shared';

@Entity('iot_devices')
@Check(`"status" IN ('online', 'offline')`)
export class IotDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_iot_devices_farm_id')
  @Column({ name: 'farm_id', type: 'uuid' })
  farmId: string;

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'offline' })
  status: IotDeviceStatus;

  @Column({ name: 'battery_level', type: 'int', nullable: true })
  batteryLevel: number | null;

  @Column({ name: 'sensor_types', type: 'text', array: true })
  sensorTypes: string[];

  @Column({ name: 'firmware_version', type: 'varchar', length: 32, nullable: true })
  firmwareVersion: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
```

### `NewsArticleEntity` — `be/apps/notification-service/src/news/news-article.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('news_articles')
export class NewsArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_news_articles_trader_id')
  @Column({ name: 'trader_id', type: 'uuid' })
  traderId: string;

  @Column({ type: 'varchar', length: 512 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 128 })
  category: string;

  @Column({ name: 'image_url', type: 'varchar', length: 2048, nullable: true })
  imageUrl?: string | null;

  @Index('idx_news_articles_published_at')
  @Column({ name: 'published_at', type: 'timestamptz' })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
```

### `NotificationEntity` — `be/apps/notification-service/src/notifications/notification.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
@Check(`"type" IN ('alert', 'contract', 'connection', 'system')`)
@Check(`"severity" IS NULL OR "severity" IN ('info', 'warning', 'danger')`)
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_notifications_user_id')
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  type: 'alert' | 'contract' | 'connection' | 'system';

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  severity?: 'info' | 'warning' | 'danger';

  @Column({ name: 'link_to', type: 'varchar', length: 1024, nullable: true })
  linkTo?: string;

  @Index('idx_notifications_unread')
  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

### `OrderEntity` — `be/apps/contract-service/src/orders/entities/order.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'contracted'
  | 'completed';

@Entity('orders')
@Check('"quantity" > 0')
@Check('"total_price" >= 0')
@Check('"deposit" IS NULL OR "deposit" >= 0')
@Check('"deposit" IS NULL OR "deposit" <= "total_price"')
@Check(`"status" IN ('pending', 'accepted', 'rejected', 'cancelled', 'contracted', 'completed')`)
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_orders_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Index('idx_orders_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  @Index('idx_orders_product_id')
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'total_price', type: 'numeric', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  deposit: number | null;

  @Index('idx_orders_status')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `ProductEntity` — `be/apps/contract-service/src/products/entities/product.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ProductStatus = 'active' | 'inactive';

@Entity('products')
@Check('"price" >= 0')
@Check('"stock_quantity" IS NULL OR "stock_quantity" >= 0')
@Check(`"status" IN ('active', 'inactive')`)
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_products_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  @Index('idx_products_farm_id')
  @Column({ name: 'farm_id', nullable: true, type: 'varchar' })
  farmId: string | null;

  @Column()
  name: string;

  @Column({ name: 'crop_type' })
  cropType: string;

  @Column()
  unit: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ name: 'standard_code', nullable: true, type: 'varchar' })
  standardCode: string | null;

  @Column({ name: 'stock_quantity', nullable: true, type: 'int' })
  stockQuantity: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_products_status')
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `ProposalEntity` — `be/apps/contract-service/src/proposals/entities/proposal.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BuyingRequestEntity } from '../../buying-requests/entities/buying-request.entity';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

@Entity('proposals')
@Check('"price" > 0')
@Check('"quantity" > 0')
@Check(`"status" IN ('pending', 'accepted', 'rejected')`)
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_proposals_buying_request_id')
  @Column({ name: 'buying_request_id' })
  buyingRequestId: string;

  @ManyToOne(() => BuyingRequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buying_request_id' })
  buyingRequest: BuyingRequestEntity;

  @Index('idx_proposals_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 15, scale: 3 })
  quantity: number;

  @Column({ name: 'standard_code', nullable: true, type: 'varchar' })
  standardCode: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Index('idx_proposals_status')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ProposalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `SensorDeviceEntity` — `be/apps/monitoring-service/src/sensors/sensor-device.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SensorDeviceType = 'temperature' | 'humidity' | 'light' | 'soil_moisture';

@Entity('sensor_devices')
@Check(`"sensor_type" IN ('temperature', 'humidity', 'light', 'soil_moisture')`)
export class SensorDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sensor_devices_farm_id')
  @Column({ name: 'farm_id', type: 'uuid' })
  farmId: string;

  @Column({ name: 'device_id', type: 'varchar', length: 64, unique: true })
  deviceId: string;

  @Column({ name: 'mac_address', type: 'macaddr', unique: true })
  macAddress: string;

  @Column({ name: 'sensor_type', type: 'varchar', length: 32 })
  sensorType: SensorDeviceType;

  @Column({ name: 'firmware_version', type: 'varchar', length: 32, nullable: true })
  firmwareVersion: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

### `StandardStepEntity` — `be/apps/farm-service/src/standards/entities/standard-step.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StandardEntity } from './standard.entity';

@Entity('standard_steps')
export class StandardStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'standard_id' })
  standardId: string;

  @ManyToOne(() => StandardEntity, (std) => std.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_id' })
  standard: StandardEntity;

  @Column({ type: 'int' })
  order: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'expected_duration_days', type: 'int', nullable: true })
  expectedDurationDays: number | null;

  @Column({ name: 'acceptance_criteria', type: 'text', nullable: true })
  acceptanceCriteria: string | null;
}
```

### `StandardEntity` — `be/apps/farm-service/src/standards/entities/standard.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StandardStepEntity } from './standard-step.entity';

@Entity('standards')
export class StandardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Index('idx_standards_crop_type')
  @Column({ name: 'crop_type', nullable: true, type: 'varchar', length: 128 })
  cropType: string | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Index('idx_standards_owner_trader_id')
  @Column({ name: 'owner_trader_id', nullable: true, type: 'varchar' })
  ownerTraderId: string | null;

  @OneToMany(() => StandardStepEntity, (step) => step.standard, {
    cascade: true,
    eager: false,
  })
  steps: StandardStepEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `TraderReviewEntity` — `be/apps/contract-service/src/trader-reviews/entities/trader-review.entity.ts`

```typescript
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trader_reviews')
@Check('"rating" BETWEEN 1 AND 5')
@Index('idx_trader_reviews_buyer_order', ['buyerId', 'orderId'], { unique: true })
export class TraderReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_trader_reviews_trader_id')
  @Column({ name: 'trader_id' })
  traderId: string;

  @Index('idx_trader_reviews_buyer_id')
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'order_id', nullable: true, type: 'uuid' })
  orderId: string | null;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
```

### `UserEntity` — `be/apps/auth-service/src/auth/entities/user.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest' | 'admin';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'zalo_id', unique: true })
  zaloId: string;

  @Column({
    type: 'enum',
    enum: ['farmer', 'trader', 'buyer', 'guest', 'admin'],
    default: 'guest',
  })
  role: UserRole;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ nullable: true, name: 'phone' })
  phone: string | null;

  @Column({ nullable: true, name: 'email' })
  email: string | null;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'trader_profile' })
  traderProfile: {
    companyName: string;
    region: string;
    capacity: string;
    trustScore: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true, name: 'farmer_profile' })
  farmerProfile: {
    region: string;
    experienceYears: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true, name: 'buyer_profile' })
  buyerProfile: {
    organizationName?: string;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @Column({ name: 'username', unique: true, nullable: true })
  username: string | null;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string | null;
}
```

---

*Tài liệu được trích từ mã nguồn TypeORM (`*.entity.ts`). Nếu có migration SQL hoặc schema PostgREST tách biệt, cần đối chiếu bổ sung. Để đồng bộ danh sách bảng sau này, chạy: `rg "@Entity\\(" be -g "*.entity.ts"`.*
