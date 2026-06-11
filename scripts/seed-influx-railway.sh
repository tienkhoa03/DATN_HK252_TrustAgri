#!/bin/bash
# Seed InfluxDB trên Railway — ghi qua HTTP write API thay vì docker exec.
# Railway không có docker exec, nên dùng public URL của service InfluxDB.
#
# Cách dùng (chạy từ máy, vd Git Bash trên Windows):
#   export INFLUXDB_URL="https://<influxdb-service>.up.railway.app"   # public domain Railway
#   export INFLUXDB_TOKEN="<token lấy từ Variables của service InfluxDB>"
#   export INFLUXDB_ORG="trustagri"          # tùy chọn, mặc định trustagri
#   export INFLUXDB_BUCKET="sensor_data"     # tùy chọn, mặc định sensor_data
#   bash scripts/seed-influx-railway.sh
set -euo pipefail

INFLUXDB_URL="${INFLUXDB_URL:?Cần export INFLUXDB_URL (public domain Railway, vd https://xxx.up.railway.app)}"
# Token: ưu tiên đọc từ file scripts/.influx-token (an toàn với mọi ký tự đặc biệt: " ' space),
# fallback về biến môi trường INFLUXDB_TOKEN.
TOKEN_FILE="$(dirname "$0")/.influx-token"
if [ -f "$TOKEN_FILE" ]; then
  INFLUXDB_TOKEN="$(cat "$TOKEN_FILE")"
fi
# Dọn token: bỏ CR/LF (CRLF Windows), BOM UTF-8, whitespace 2 đầu, và nháy " ' bao quanh.
INFLUXDB_TOKEN="$(printf '%s' "${INFLUXDB_TOKEN:-}" | tr -d '\r\n' \
  | sed -e 's/^\xEF\xBB\xBF//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//')"
INFLUXDB_TOKEN="${INFLUXDB_TOKEN:?Cần export INFLUXDB_TOKEN hoặc tạo file scripts/.influx-token}"
ORG="${INFLUXDB_ORG:-trustagri}"
BUCKET="${INFLUXDB_BUCKET:-sensor_data}"
INFLUXDB_URL="${INFLUXDB_URL%/}"   # bỏ slash cuối
# Tự thêm https:// nếu thiếu scheme — Railway redirect http→https (301) sẽ phá POST có body từ stdin.
case "$INFLUXDB_URL" in
  http://*|https://*) ;;
  *) INFLUXDB_URL="https://$INFLUXDB_URL" ;;
esac

# Farm IDs — PHẢI khớp các vườn demo trong be/scripts/seed-demo-scenario.sql.
# (Backend query InfluxDB theo tag farmId = id vườn trong bảng farms.)
FARM_IDS=(
  "a1111111-0000-4000-8000-000000000001"  # Vườn xoài cát Hòa Lộc
  "a1111111-0000-4000-8000-000000000002"  # Vườn sầu riêng Monthong
)

NOW=$(date +%s)
LINES=""

# Schema line-protocol PHẢI khớp InfluxSensorService (be/apps/monitoring-service):
#   measurement = sensor_reading (số ít)
#   tags        = farmId, sensorType, isImputed   (camelCase)
#   field       = value (float)
#   sensorType ∈ temperature | humidity | light | soil_moisture
# Sinh dữ liệu 7 ngày qua, mỗi 30 phút một điểm = 48 điểm/ngày/sensor cho mỗi vườn
for FARM_ID in "${FARM_IDS[@]}"; do
for day in $(seq 6 -1 0); do
  for slot in $(seq 0 47); do
    TS=$(( NOW - day * 86400 - slot * 1800 ))
    TS_NS="${TS}000000000"
    HOUR=$(( (TS % 86400) / 3600 ))

    # Temperature (°C)
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      TEMP=$(awk -v h=$HOUR -v r=$RANDOM 'BEGIN { printf "%.1f", 24 + (h-6)*0.8 + (r%50)/10.0 }')
    else
      TEMP=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 20 + (r%40)/10.0 }')
    fi

    # Humidity (%)
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      HUMID=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 60 + (r%200)/10.0 }')
    else
      HUMID=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 75 + (r%150)/10.0 }')
    fi

    # Light (lux) — luôn dạng float (.0) để cùng kiểu field với các sensor khác,
    # tránh InfluxDB reject vì xung đột int/float trên cùng field "value".
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      LIGHT=$(awk -v h=$HOUR -v r=$RANDOM 'BEGIN {
        peak = 50000 + (r%30000)
        if (h < 12) v = peak * (h-6) / 6.0
        else v = peak * (18-h) / 6.0
        printf "%.1f", v
      }')
    else
      LIGHT="0.0"
    fi

    # Soil moisture (%)
    MOIST=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 45 + (r%350)/10.0 }')

    # ~12% điểm đánh dấu isImputed=true để test NFR-A01.
    IMP=$(awk -v r=$RANDOM 'BEGIN { print (r%100 < 12) ? "true" : "false" }')

    LINES="$LINES
sensor_reading,farmId=${FARM_ID},sensorType=temperature,isImputed=${IMP} value=${TEMP} ${TS_NS}
sensor_reading,farmId=${FARM_ID},sensorType=humidity,isImputed=${IMP} value=${HUMID} ${TS_NS}
sensor_reading,farmId=${FARM_ID},sensorType=light,isImputed=${IMP} value=${LIGHT} ${TS_NS}
sensor_reading,farmId=${FARM_ID},sensorType=soil_moisture,isImputed=${IMP} value=${MOIST} ${TS_NS}"
  done
done
done

PAYLOAD=$(echo "$LINES" | grep -v '^$')
COUNT=$(echo "$PAYLOAD" | grep -c sensor_reading)

echo "Ghi $COUNT điểm vào ${INFLUXDB_URL} (org=${ORG}, bucket=${BUCKET})..."

HTTP_CODE=$(echo "$PAYLOAD" | curl -sS -o /tmp/influx_write.out -w '%{http_code}' \
  --request POST \
  "${INFLUXDB_URL}/api/v2/write?org=${ORG}&bucket=${BUCKET}&precision=ns" \
  --header "Authorization: Token ${INFLUXDB_TOKEN}" \
  --header "Content-Type: text/plain; charset=utf-8" \
  --data-binary @-)

if [ "$HTTP_CODE" = "204" ]; then
  echo "Done! Đã ghi $COUNT điểm dữ liệu vào InfluxDB (Railway)."
else
  echo "LỖI HTTP $HTTP_CODE:" >&2
  cat /tmp/influx_write.out >&2
  exit 1
fi
