#!/bin/bash
# Seed InfluxDB với dữ liệu mẫu cho farm 1be8074d-7c15-4d5d-8368-32830d0663ca
# Chạy bên ngoài container: bash scripts/seed-influx.sh

CONTAINER="trustagri-influxdb"
TOKEN="trustagri-influx-token"
ORG="trustagri"
BUCKET="sensor_data"
FARM_ID="1be8074d-7c15-4d5d-8368-32830d0663ca"

# Sensor IDs
TEMP_SENSOR="sensor-temp-001"
HUMID_SENSOR="sensor-humid-001"
LIGHT_SENSOR="sensor-light-001"
MOIST_SENSOR="sensor-moist-001"

NOW=$(date +%s)
LINES=""

# Sinh dữ liệu 7 ngày qua, mỗi 30 phút một điểm = 48 điểm/ngày/sensor
for day in $(seq 6 -1 0); do
  for slot in $(seq 0 47); do
    # Timestamp = (now - day*86400 - slot*1800) giây
    TS=$(( NOW - day * 86400 - slot * 1800 ))
    TS_NS="${TS}000000000"

    # Giờ trong ngày (0-23) để tính giá trị thực tế
    HOUR=$(( (TS % 86400) / 3600 ))

    # Temperature: ban ngày cao hơn (°C, 22-34)
    # Dùng RANDOM để thêm nhiễu
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      TEMP=$(awk -v h=$HOUR -v r=$RANDOM 'BEGIN { printf "%.1f", 24 + (h-6)*0.8 + (r%50)/10.0 }')
    else
      TEMP=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 20 + (r%40)/10.0 }')
    fi

    # Humidity: ngược chiều nhiệt độ (%)
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      HUMID=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 60 + (r%200)/10.0 }')
    else
      HUMID=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 75 + (r%150)/10.0 }')
    fi

    # Light: ban ngày cao, ban đêm = 0 (lux)
    if [ $HOUR -ge 6 ] && [ $HOUR -le 18 ]; then
      LIGHT=$(awk -v h=$HOUR -v r=$RANDOM 'BEGIN {
        peak = 50000 + (r%30000)
        if (h < 12) v = peak * (h-6) / 6.0
        else v = peak * (18-h) / 6.0
        printf "%.0f", v
      }')
    else
      LIGHT="0"
    fi

    # Soil moisture (%)
    MOIST=$(awk -v r=$RANDOM 'BEGIN { printf "%.1f", 45 + (r%350)/10.0 }')

    # Build line protocol
    LINES="$LINES
sensor_readings,farm_id=${FARM_ID},sensor_id=${TEMP_SENSOR},sensor_type=temperature value=${TEMP},isImputed=false ${TS_NS}
sensor_readings,farm_id=${FARM_ID},sensor_id=${HUMID_SENSOR},sensor_type=humidity value=${HUMID},isImputed=false ${TS_NS}
sensor_readings,farm_id=${FARM_ID},sensor_id=${LIGHT_SENSOR},sensor_type=light value=${LIGHT},isImputed=false ${TS_NS}
sensor_readings,farm_id=${FARM_ID},sensor_id=${MOIST_SENSOR},sensor_type=moisture value=${MOIST},isImputed=false ${TS_NS}"
  done
done

echo "$LINES" | grep -v '^$' | docker exec -i "$CONTAINER" \
  influx write \
    --token "$TOKEN" \
    --org "$ORG" \
    --bucket "$BUCKET" \
    --precision ns \
    --format lp

echo "Done! Đã ghi $(echo "$LINES" | grep -c sensor_readings) điểm dữ liệu vào InfluxDB."
