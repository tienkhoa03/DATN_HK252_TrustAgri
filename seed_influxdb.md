# Seed InfluxDB — Hướng dẫn thêm dữ liệu cảm biến thủ công

> Mục tiêu: sau khi `docker compose up`, UI giám sát farmer/trader/buyer phải có data hiển thị (nhiệt độ, độ ẩm, ánh sáng, độ ẩm đất). Mặc định InfluxDB rỗng → UI hiện trống. File này hướng dẫn 3 cách seed nhanh.

## Schema (design.md §5.2)

```
measurement: sensor_reading
tags:
  - farmId      (UUID — phải khớp một farm thật trong PostgreSQL)
  - sensorType  (temperature | humidity | light | soil_moisture)
  - isImputed   ("true" | "false" — mặc định "false")
field:
  - value       (float — giá trị đo)
time:           timestamp UTC (mặc định now())
bucket:         sensor_data (do INFLUXDB_BUCKET trong be/.env)
org:            trustagri (do INFLUXDB_ORG trong be/.env)
```

Unit map (BE tự suy ra khi đọc):
- temperature → °C
- humidity → %
- light → lux
- soil_moisture → %

---

## Cách 1: Seed nhanh bằng script Bash (khuyến nghị)

Tạo file `be/scripts/seed-influxdb.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

INFLUX_URL="${INFLUXDB_URL:-http://localhost:8086}"
INFLUX_TOKEN="${INFLUXDB_TOKEN:-trustagri-influx-token}"
INFLUX_ORG="${INFLUXDB_ORG:-trustagri}"
INFLUX_BUCKET="${INFLUXDB_BUCKET:-sensor_data}"

# ⚠️ Thay FARM_ID bằng UUID thật từ PostgreSQL: 
#    docker exec trustagri-postgres psql -U trustagri -d trustagri -c "SELECT id, name FROM farms LIMIT 5"
FARM_ID="${1:-}"
if [ -z "$FARM_ID" ]; then
  echo "Usage: $0 <farm-uuid>"
  echo "Get a real farm UUID via:"
  echo "  docker exec trustagri-postgres psql -U trustagri -d trustagri -c \"SELECT id, name FROM farms LIMIT 5\""
  exit 1
fi

# Seed 24h dữ liệu (60 điểm — mỗi điểm 24 phút) cho 4 sensor type
NOW_NS=$(date +%s)000000000
INTERVAL_NS=1440000000000   # 24 phút = 24 * 60 * 10^9

build_lp() {
  local farm_id="$1" sensor_type="$2" value="$3" ts="$4"
  echo "sensor_reading,farmId=${farm_id},sensorType=${sensor_type},isImputed=false value=${value} ${ts}"
}

LP=""
for i in $(seq 0 59); do
  ts=$((NOW_NS - i * INTERVAL_NS))
  # Giả lập cosine-like cho temperature, sine-like cho humidity, ramp cho light
  TEMP=$(awk -v i="$i" 'BEGIN { printf "%.2f", 26 + 4*sin(i/9) }')
  HUMID=$(awk -v i="$i" 'BEGIN { printf "%.2f", 70 + 10*cos(i/11) }')
  LIGHT=$(awk -v i="$i" 'BEGIN { printf "%.0f", (i<30 ? 8000 - i*200 : 0) }')
  SOIL=$(awk -v i="$i" 'BEGIN { printf "%.2f", 45 + 6*sin(i/13) }')
  LP+="$(build_lp "$FARM_ID" "temperature" "$TEMP" "$ts")
"
  LP+="$(build_lp "$FARM_ID" "humidity" "$HUMID" "$ts")
"
  LP+="$(build_lp "$FARM_ID" "light" "$LIGHT" "$ts")
"
  LP+="$(build_lp "$FARM_ID" "soil_moisture" "$SOIL" "$ts")
"
done

echo "Pushing 240 points to InfluxDB at $INFLUX_URL ..."
curl -fsSL -X POST \
  "${INFLUX_URL}/api/v2/write?org=${INFLUX_ORG}&bucket=${INFLUX_BUCKET}&precision=ns" \
  -H "Authorization: Token ${INFLUX_TOKEN}" \
  -H "Content-Type: text/plain; charset=utf-8" \
  --data-binary "$LP"
echo "Done. Verify with:"
echo "  docker exec trustagri-influxdb influx query --org $INFLUX_ORG --token $INFLUX_TOKEN 'from(bucket:\"$INFLUX_BUCKET\") |> range(start: -24h) |> filter(fn: (r) => r.farmId == \"$FARM_ID\") |> last()'"
```

Chạy:

```bash
chmod +x be/scripts/seed-influxdb.sh

# 1. Lấy farmId thật từ PostgreSQL:
docker exec trustagri-postgres psql -U trustagri -d trustagri -c "SELECT id, name FROM farms LIMIT 5"

# 2. Seed với farmId vừa lấy:
./be/scripts/seed-influxdb.sh <farm-uuid-thuc>
```

> **Windows / PowerShell**: dùng Cách 2 hoặc Cách 3.

---

## Cách 2: Seed thủ công qua `influx` CLI bên trong container

```bash
# 1. Vào container
docker exec -it trustagri-influxdb sh

# 2. Cấu hình CLI một lần (token + org)
influx config create \
  --config-name local \
  --host-url http://localhost:8086 \
  --org trustagri \
  --token trustagri-influx-token \
  --active

# 3. Ghi 1 điểm dữ liệu (Line Protocol)
influx write --bucket sensor_data \
  --precision s \
  "sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=soil_moisture,isImputed=false value=48.5"

# 4. Ghi batch nhiều điểm
influx write --bucket sensor_data --precision s @/path/to/lp.txt
```

Trong đó `lp.txt`:
```
sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=temperature,isImputed=false value=26.3
sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=temperature,isImputed=false value=27.1 1715000000
sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=humidity,isImputed=false value=72
sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=light,isImputed=false value=8200
sensor_reading,farmId=1be8074d-7c15-4d5d-8368-32830d0663ca,sensorType=soil_moisture,isImputed=false value=48.5
```

---

## Cách 3: Seed nhanh qua HTTP API (curl / PowerShell / Postman)

### Bash / curl

```bash
TOKEN=trustagri-influx-token
ORG=trustagri
BUCKET=sensor_data
FARM_ID=<UUID-vườn-thật>

curl -X POST \
  "http://localhost:8086/api/v2/write?org=$ORG&bucket=$BUCKET&precision=s" \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: text/plain; charset=utf-8" \
  --data-binary "sensor_reading,farmId=$FARM_ID,sensorType=temperature,isImputed=false value=28.5
sensor_reading,farmId=$FARM_ID,sensorType=humidity,isImputed=false value=72.1
sensor_reading,farmId=$FARM_ID,sensorType=light,isImputed=false value=8000
sensor_reading,farmId=$FARM_ID,sensorType=soil_moisture,isImputed=false value=45.6"
```

### PowerShell

```powershell
$token   = 'trustagri-influx-token'
$org     = 'trustagri'
$bucket  = 'sensor_data'
$farmId  = '<UUID-vườn-thật>'

$body = @"
sensor_reading,farmId=$farmId,sensorType=temperature,isImputed=false value=28.5
sensor_reading,farmId=$farmId,sensorType=humidity,isImputed=false value=72.1
sensor_reading,farmId=$farmId,sensorType=light,isImputed=false value=8000
sensor_reading,farmId=$farmId,sensorType=soil_moisture,isImputed=false value=45.6
"@

Invoke-RestMethod `
  -Uri "http://localhost:8086/api/v2/write?org=$org&bucket=$bucket&precision=s" `
  -Method POST `
  -Headers @{ Authorization = "Token $token"; 'Content-Type' = 'text/plain; charset=utf-8' } `
  -Body $body
```

---

## Lấy farmId thật

InfluxDB filter theo `farmId`, mà các farmId là UUID lưu trong PostgreSQL `farms.id`. Phải dùng UUID thực:

```bash
# Liệt kê 5 farm gần nhất
docker exec trustagri-postgres psql -U trustagri -d trustagri \
  -c "SELECT id, name, owner_id FROM farms ORDER BY created_at DESC LIMIT 5"
```

Hoặc trong UI Mini App: bấm vào card vườn → URL có dạng `/farmer/garden/<farmId>` — copy ID đó.

---

## Verify dữ liệu đã ghi

```bash
docker exec trustagri-influxdb influx query \
  --org trustagri \
  --token trustagri-influx-token \
  'from(bucket: "sensor_data") |> range(start: -24h) |> filter(fn: (r) => r._measurement == "sensor_reading" and r.farmId == "1be8074d-7c15-4d5d-8368-32830d0663ca") |> last()'
```

Hoặc qua UI InfluxDB: mở `http://localhost:8086` (login = trustagri / trustagri_secret) → Data Explorer → chọn bucket `sensor_data` → query.

---

## Lưu ý quan trọng

1. **`farmId` phải khớp một vườn thật trong PostgreSQL**, nếu không API `GET /api/v1/monitoring/sensors/:farmId` sẽ:
   - Reject vì `FarmAccessGuard` (kiểm tra ownership trong farm-service)
   - Hoặc trả về mảng rỗng nếu vườn tồn tại nhưng không có data

2. **`sensorType` phải đúng 1 trong 4 giá trị**:
   `temperature | humidity | light | soil_moisture`
   Sai sẽ vẫn ghi vào DB nhưng FE không hiển thị (vì FE filter theo whitelist).

3. **`isImputed` là tag string "true"/"false"**, không phải boolean — InfluxDB tag chỉ chứa string.
   - `false` → giá trị thật (FE hiển thị bình thường).
   - `true` → giá trị nội suy khi gateway IoT mất tín hiệu (FE đánh dấu nhỏ, NFR-A01).

4. **WebSocket realtime không tự push khi seed thủ công**:
   - WS chỉ push khi monitoring-service ingest qua endpoint POST /sensors hoặc Redis pub/sub.
   - Sau khi seed, **refresh trang** Mini App để re-fetch latest qua REST.
   - Để test realtime: POST /api/v1/monitoring/sensors (BE sẽ vừa lưu InfluxDB vừa push WS).

5. **Redis cache (24h)**: monitoring-service đọc Redis trước, fallback InfluxDB. Sau khi seed, có thể flush cache:
   ```bash
   docker exec trustagri-redis redis-cli FLUSHALL
   ```
   để force read lại từ InfluxDB.

6. **Token InfluxDB**: phải khớp với `INFLUXDB_TOKEN` trong `be/.env`. Mặc định trong docker-compose là `trustagri-influx-token`.

---

## Tính năng đã sửa trong commit này

| File | Sửa |
|---|---|
| `be/apps/monitoring-service/src/gateway/monitoring.gateway.ts` | Fix CORS gateway WebSocket (dùng `corsOriginsOrAllowAll`) |
| `be/docker-compose.yml` | Thêm `FE_ORIGINS` cho tất cả service để CORS không bị reject |
| `be/nginx/nginx.conf` | Hard-code `Connection "upgrade"` cho location /ws/monitoring |
| `be/libs/shared/src/config/http.config.ts` | Helper `corsOriginsOrAllowAll()` — fallback `true` ở dev khi `FE_ORIGINS` rỗng |

Sau khi seed data:
1. FE Farmer Dashboard / Garden Monitor → card sensor sẽ hiển thị giá trị, đơn vị, sparkline.
2. FE Trader Supply Monitor → card vườn nông dân hiển thị badge cảm biến.
3. FE Buyer Live Monitor → real-time sensor card.

Nếu chưa hiện, kiểm tra:
- Browser DevTools → Network → call `GET /api/v1/monitoring/farms/<farmId>/latest` → status 200, response có `items[]` không rỗng.
- Console log monitoring-service: `[InfluxSensorService] InfluxDB query ...` — không error.
- `web_socket_problem.md` để xác nhận WS đã kết nối.
- Redis có thể đã cache empty từ trước → flush rồi reload:
  ```bash
  docker exec trustagri-redis redis-cli FLUSHALL
  ```

---

## Tính năng có thể gặp lỗi & cách kiểm tra

| Triệu chứng | Nguyên nhân thường gặp | Fix |
|---|---|---|
| UI vẫn "Chưa có dữ liệu" sau khi seed | Redis cache rỗng "stick" hoặc API gateway chưa proxy đúng | `docker exec trustagri-redis redis-cli FLUSHALL` rồi refresh; kiểm tra nginx log |
| 403 ở endpoint `/latest` | `FarmAccessGuard` reject (user không phải owner / chưa có contract active) | Login bằng user là owner của farm, hoặc tạo contract active |
| InfluxDB 401 khi write | `INFLUXDB_TOKEN` sai | Check `be/.env` → đảm bảo khớp với token init của container InfluxDB |
| WS không nhận `sensor_update` sau seed | Seed bypass BE → WS không tự push | Refresh FE (sẽ fetch lại qua REST); hoặc dùng pipeline ingest qua POST /monitoring/sensors khi BE có endpoint write |

---

## Endpoint hiện có liên quan

- `GET /api/v1/monitoring/farms/:farmId/latest` — snapshot mới nhất (Redis → fallback InfluxDB).
- `GET /api/v1/monitoring/farms/:farmId/history?from=...&to=...&interval=1h&sensorType=temperature` — series cho chart.
- Realtime: WebSocket `/ws/monitoring/socket.io/` event `sensor_update` (đã được fix trong `web_socket_problem.md`).

> Lưu ý: hiện tại BE **chưa có** endpoint POST để ghi sensor reading (data ingestion pipeline chưa implement). Cách duy nhất để có data demo là seed thủ công vào InfluxDB như trên.

Nếu cần realistic full pipeline (POST → InfluxDB → Redis → WS broadcast → Alert check), cần bổ sung:
- `InfluxSensorService.writeReading(reading)` — gửi Line Protocol qua influxdb-client SDK.
- `POST /api/v1/monitoring/sensors` controller mới (role: admin / iot-device).
- Gọi `sensorsService.ingestReading()` hiện tại (đã viết, chỉ ghi Redis + push WS + check alert), bổ sung `influx.writeReading()`.

Tham khảo TODO trong `be/apps/monitoring-service/src/sensors/services/influx-sensor.service.ts` — hiện chỉ có method query, không có write.
