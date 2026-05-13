# Thiết kế InfluxDB — trả lời theo codebase TrustAgri

Tài liệu này trả lời ba câu hỏi về luồng ghi, tính toàn vẹn liên CSDL và chính sách lưu giữ, **bám sát mã nguồn và spec hiện tại** (không suy diễn thành đã triển khai nếu repo chưa có).

---

## Câu hỏi 1 — Luồng ghi (Write Flow) và mô hình P-MIMP / Kafka

### Kết luận ngắn

- Trong repository **không có** tích hợp Kafka, **không có** topic “Clean Data”, **không có** tham chiếu tới mô hình P-MIMP.
- **Monitoring Service** hiện chỉ **đọc** InfluxDB qua Flux (`QueryApi`); **không có** mã ghi (`WriteApi` / `writePoint`) vào InfluxDB.
- Luồng ghi thời gian thực gần nhất là `SensorsService.ingestReading`: ghi **Redis**, đẩy WebSocket, kiểm tra ngưỡng cảnh báo — **không** ghi InfluxDB.

### Chi tiết từ code

- `InfluxSensorService` chỉ khởi tạo client với `getQueryApi` và các hàm `getLatest` / `getHistory` — toàn bộ là truy vấn.

```14:35:c:\Users\VivoBookS\_code_\_CapstoneProject\trustagri\be\apps\monitoring-service\src\sensors\services\influx-sensor.service.ts
/**
 * Truy vấn InfluxDB cho dữ liệu cảm biến.
 * Schema (design.md §5.2):
 *   measurement: sensor_reading
 *   tags:        farmId, sensorType, isImputed
 *   fields:      value
 */
@Injectable()
export class InfluxSensorService {
  ...
    const influx = new InfluxDB({ url, token });
    this.queryApi = influx.getQueryApi(org);
  }
```

```86:95:c:\Users\VivoBookS\_code_\_CapstoneProject\trustagri\be\apps\monitoring-service\src\sensors\sensors.service.ts
  /**
   * Ghi một reading mới vào Redis, push WebSocket sensor_update,
   * và kiểm tra ngưỡng để tạo alert nếu cần.
   * Dùng khi có data ingestion pipeline (MQTT, HTTP ingestion, v.v.)
   */
  async ingestReading(reading: SensorReadingDto): Promise<void> {
    await this.redis.setReading(reading);
    this.gateway.pushSensorUpdate(reading.farmId, reading);
    await this.alertsService.checkAndCreateAlert(reading);
  }
```

### So với tài liệu nghiệp vụ

`.claude/docs/business-logic.md` mô tả bước “Writes to InfluxDB” sau khi Monitoring Service nhận message — đó là **hướng kiến trúc mục tiêu**, chưa khớp hoàn toàn với implementation hiện tại (thiếu tầng ghi InfluxDB trong code).

### Nếu muốn chứng minh vai trò P-MIMP trong luận văn / bảo vệ

- **Kiến trúc đề xuất (ngoài code hiện tại):** tầng làm sạch / điền khuyết (P-MIMP) nên đặt **trước** khi dữ liệu được coi là “đã tin cậy” để lưu dài hạn; consumer (ví dụ Monitoring Service hoặc worker riêng) có thể subscribe topic dữ liệu đã qua P-MIMP rồi mới `write` vào InfluxDB — như vậy **tính toàn vẹn của chuỗi thời gian** (ít outlier, có cờ `isImputed`) được bảo vệ ở ranh giới ghi.
- **Trạng thái repo:** luồng Kafka + P-MIMP cần được mô tả như **phần mở rộng / pipeline tương lai**, không phải hành vi đã có trong mã.

---

## Câu hỏi 2 — Tính toàn vẹn chéo (InfluxDB ↔ PostgreSQL)

### Kết luận ngắn

- InfluxDB **không hỗ trợ khóa ngoại**. Mọi quan hệ với PostgreSQL là **ước lệ ở tầng ứng dụng** (đôi khi gọi là *virtual / logical foreign keys*).
- Schema Influx được **spec và code** dùng cho measurement `sensor_reading` với tag **`farmId`**, **`sensorType`**, **`isImputed`** — **không** thấy tag `node_id` trong implementation đọc/ghi hiện tại (và chưa có ghi thực tế).

```593:597:c:\Users\VivoBookS\_code_\_CapstoneProject\trustagri\specs\backend-api-specification\design.md
### 5.2 InfluxDB (chuỗi thời gian)

- measurement: `sensor_reading`
- tags: `farmId`, `sensorType`, `isImputed`
- fields: `value`
```

### Ánh xạ `farm_id` / `farmId`

- **Đúng về mặt ý tưởng:** giá trị tag `farmId` (hoặc quy ước đặt tên `farm_id` trong Influx) nên trùng **`farms.id`** (UUID) trong PostgreSQL.

```23:27:c:\Users\VivoBookS\_code_\_CapstoneProject\trustagri\be\apps\farm-service\src\farms\entities\farm.entity.ts
@Entity('farms')
@Check('"area" > 0')
export class FarmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
```

- **Lưu ý:** đây không phải FK được DB enforce; cần validate khi ingest (đã đăng ký farm, quyền sở hữu thiết bị, v.v.).

### Tag `node_id` và bảng `sensor_devices`

- Trong PostgreSQL, `sensor_devices` có **khóa chính** `id` (UUID) và cột **`device_id`** (định danh vendor/serial, `varchar`, unique) — **hai cột khác nhau**.

```17:32:c:\Users\VivoBookS\_code_\_CapstoneProject\trustagri\be\apps\monitoring-service\src\sensors\sensor-device.entity.ts
@Entity('sensor_devices')
...
export class SensorDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  ...
  @Column({ name: 'device_id', type: 'varchar', length: 64, unique: true })
  deviceId: string;
```

- **Nếu** trong thiết kế luận văn bạn dùng tag `node_id`:
  - Thường **hợp lý nhất** là map tới **`sensor_devices.id`** (UUID nội bộ) hoặc tới **`iot_devices.id`** nếu “node” là thiết bị vật lý gom nhiều cảm biến (`iot_devices` trong monitoring-service).
  - Map trực tiếp tới **`sensor_devices.device_id`** chỉ đúng khi pipeline IoT thực sự gửi đúng chuỗi vendor đó làm định danh node; khi đó vẫn là khóa **business**, không phải PK UUID.
- **Trả lời thẳng câu hỏi:** “`node_id` ánh xạ trực tiếp tới `device_id`” **không** được chứng minh bởi codebase Influx hiện tại (chưa có tag đó trong spec §5.2 / `InfluxSensorService`). Khi bổ sung, cần **chốt quy ước một cột** (UUID nội bộ hay `device_id`) và ghi rõ trong tài liệu thiết kế.

---

## Câu hỏi 3 — Chính sách lưu giữ (Retention) và tối ưu tài nguyên

### Có nên bổ sung lập luận về Retention / downsampling?

**Có.** Với InfluxDB 2.x, vòng đời dữ liệu chủ yếu quản lý bằng **retention trên bucket** (và tùy chọn **tasks** để downsampling sang bucket/measurement tổng hợp). Docker Compose hiện chỉ khởi tạo org/bucket mặc định; **chưa** thấy cấu hình retention tùy chỉnh trong repo — đây là điểm thích hợp để trình bày **kinh nghiệm vận hành** trong luận văn.

### Gợi ý lập luận ngắn (có thể đưa nguyên văn vào báo cáo)

1. **Dữ liệu thô cảm biến** tần suất cao: đặt retention bucket (ví dụ **6 tháng** hoặc **12 tháng** tùy yêu cầu pháp lý / vận hành) để tránh phình disk vô hạn.
2. **Downsampling:** dùng task định kỳ (ví dụ sau 30 ngày gộp **mean/max/min theo giờ**, sau 180 ngày gộp **theo ngày**) và lưu vào measurement hoặc bucket “long_term” — dashboard lịch sử dài chỉ đọc bản tổng hợp, chi tiết gần thời điểm hiện tại vẫn đọc độ phân giải cao.
3. **Liên hệ domain:** trường `isImputed` trong tag (theo spec) giúp phân biệt điểm gốc và điểm đã xử lý; chính sách retention có thể **giữ lâu hơn** chuỗi đã làm sạch / đã gộp để báo cáo tuân thủ, tùy policy.

### Lưu ý thuật ngữ

- InfluxDB 1.x dùng “Retention Policy (RP)” gắn database; **InfluxDB 2.x** thường nói **bucket retention period** + **Tasks**. Khi trình bày với hội đồng, nên nêu rõ phiên bản (repo dùng image `influxdb:2.7`).

---

## Tóm tắt một dòng

| Chủ đề | Thực tế trong repo |
|--------|---------------------|
| Kafka / Clean Data / P-MIMP | Không có trong code; phù hợp mô tả như kiến trúc mở rộng |
| Ghi InfluxDB | Chưa triển khai; chỉ có đọc Flux; ingest hiện vào Redis |
| Tag & FK ảo | `farmId` ↔ `farms.id` (logical); không có `node_id` trong spec/code Influx hiện tại; `sensor_devices` có `id` vs `device_id` — cần quy ước rõ nếu thêm tag |
| Retention | Nên bổ sung trong luận văn (bucket retention + downsampling); chưa cấu hình chi tiết trong repo |
