import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';
import { SensorReadingDto } from '@trustagri/shared';

/** Đơn vị mặc định theo loại cảm biến */
const UNIT_MAP: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  light: 'lux',
  soil_moisture: '%',
};

/**
 * Truy vấn InfluxDB cho dữ liệu cảm biến.
 * Schema (design.md §5.2):
 *   measurement: sensor_reading
 *   tags:        farmId, sensorType, isImputed
 *   fields:      value
 */
@Injectable()
export class InfluxSensorService {
  private readonly logger = new Logger(InfluxSensorService.name);
  private readonly queryApi: QueryApi;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('INFLUXDB_URL', 'http://localhost:8086');
    const token = config.get<string>('INFLUXDB_TOKEN', '');
    const org = config.get<string>('INFLUXDB_ORG', 'trustagri');
    this.bucket = config.get<string>('INFLUXDB_BUCKET', 'sensor_data');

    const influx = new InfluxDB({ url, token });
    this.queryApi = influx.getQueryApi(org);
  }

  /**
   * Lấy giá trị mới nhất của từng loại cảm biến trong 24 giờ gần nhất.
   * Dùng làm fallback khi Redis không có dữ liệu.
   */
  async getLatest(farmId: string): Promise<SensorReadingDto[]> {
    const flux = `
from(bucket: "${this.bucket}")
  |> range(start: -24h)
  |> filter(fn: (r) =>
      r._measurement == "sensor_reading" and
      r.farmId == "${farmId}" and
      r._field == "value"
  )
  |> last()
`;
    return this.executeQuery(flux, farmId);
  }

  /**
   * Lấy lịch sử cảm biến theo khoảng thời gian và tổng hợp theo window.
   * @param from  ISO-8601 hoặc Flux relative (ví dụ: -7d)
   * @param to    ISO-8601 hoặc "now()"
   * @param interval   Flux duration (ví dụ: 1h, 30m). Mặc định 1h.
   * @param sensorType Lọc loại cảm biến (tuỳ chọn).
   */
  async getHistory(
    farmId: string,
    from: string,
    to: string,
    interval?: string,
    sensorType?: string,
  ): Promise<SensorReadingDto[]> {
    const sensorFilter = sensorType
      ? `  |> filter(fn: (r) => r.sensorType == "${sensorType}")`
      : '';

    const windowInterval = interval ?? '1h';

    const flux = `
from(bucket: "${this.bucket}")
  |> range(start: ${from}, stop: ${to})
  |> filter(fn: (r) =>
      r._measurement == "sensor_reading" and
      r.farmId == "${farmId}" and
      r._field == "value"
  )
${sensorFilter}
  |> aggregateWindow(every: ${windowInterval}, fn: mean, createEmpty: false)
`;
    return this.executeQuery(flux, farmId);
  }

  private executeQuery(flux: string, farmId: string): Promise<SensorReadingDto[]> {
    const readings: SensorReadingDto[] = [];

    return new Promise<SensorReadingDto[]>((resolve) => {
      this.queryApi.queryRows(flux, {
        next: (row, tableMeta) => {
          const obj = tableMeta.toObject(row) as Record<string, unknown>;
          const sensorType = String(
            obj['sensorType'] ?? '',
          ) as SensorReadingDto['sensorType'];

          readings.push({
            farmId: String(obj['farmId'] ?? farmId),
            sensorType,
            value: parseFloat(String(obj['_value'] ?? 0)),
            unit: UNIT_MAP[sensorType] ?? '',
            isImputed: obj['isImputed'] === 'true',
            recordedAt: String(obj['_time'] ?? new Date().toISOString()),
          });
        },
        error: (err) => {
          this.logger.warn(
            `InfluxDB query failed: ${(err as Error).message}`,
          );
          resolve(readings);
        },
        complete: () => {
          resolve(readings);
        },
      });
    });
  }
}
