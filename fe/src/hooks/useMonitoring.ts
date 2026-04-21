/**
 * useMonitoring — hook giám sát cảm biến realtime (Phase 6.2).
 *
 * Luồng (thiết kế design.md §4.5):
 *   1. Cold start: GET /api/v1/monitoring/farms/:farmId/latest  (REST nguồn sự thật)
 *   2. Cold start: GET /api/v1/monitoring/farms/:farmId/alerts  (danh sách cảnh báo)
 *   3. WebSocket subscribe_farm → nhận sensor_update → merge vào Jotai atom
 *   4. getHistory(sensorType) → GET /api/v1/monitoring/farms/:farmId/history
 *
 * Bảo vệ:
 *   - Không gọi API nếu farmId null/empty.
 *   - Guard in-flight để tránh duplicate request.
 *   - API error → message tiếng Việt qua `error` string (component show Snackbar).
 *   - 401 → interceptor đã clear authSessionAtom.
 *
 * ZMP SDK:
 *   - Token đã trao đổi ở Phase 1; interceptor gắn tự động.
 *   - Không cần gọi ZMP SDK trong hook này.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import * as monitoringService from '@/services/monitoringService';
import type {
  SensorReadingDto,
  AlertDto,
  SensorType,
  HistoryParams,
} from '@/services/monitoringService';
import { subscribeToFarm, subscribeToFarmAlerts } from '@/api/monitoringSocket';
import {
  latestSensorMapAtom,
  mergeSensorReadingAtom,
  seedLatestForFarmAtom,
  setFarmAlertBadgeAtom,
  incrementFarmAlertBadgeAtom,
  decrementFarmAlertBadgeAtom,
} from '@/state/monitoringAtoms';
import { ApiError } from '@/api/errors';

// ── Error messages ────────────────────────────────────────────────────────────

function toViMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền xem dữ liệu cảm biến của vườn này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy vườn hoặc dữ liệu cảm biến.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ giám sát tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        return 'Không thể tải dữ liệu cảm biến. Vui lòng thử lại.';
    }
  }
  return 'Không thể tải dữ liệu cảm biến. Vui lòng thử lại.';
}

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseMonitoringReturn {
  /** Snapshot mới nhất từng cảm biến — kết hợp REST + realtime WS */
  latestReadings: SensorReadingDto[];
  isLatestLoading: boolean;
  /** Chuỗi thời gian lịch sử theo sensorType đã chọn */
  historyData: SensorReadingDto[];
  isHistoryLoading: boolean;
  /** Cảnh báo ngưỡng chưa xác nhận */
  alerts: AlertDto[];
  /** Thông báo lỗi tiếng Việt — null nếu không có lỗi */
  error: string | null;
  /** Tải lại chuỗi thời gian cho một loại cảm biến */
  loadHistory: (sensorType: SensorType, params?: Omit<HistoryParams, 'sensorType'>) => void;
  /** Xác nhận đã xem cảnh báo */
  acknowledgeAlert: (alertId: string) => Promise<void>;
  /** Xóa lỗi */
  clearError: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMonitoring(farmId: string | null | undefined): UseMonitoringReturn {
  const latestMap = useAtomValue(latestSensorMapAtom);
  const mergeSensor = useSetAtom(mergeSensorReadingAtom);
  const seedLatest = useSetAtom(seedLatestForFarmAtom);
  const setAlertBadge = useSetAtom(setFarmAlertBadgeAtom);
  const incrementAlertBadge = useSetAtom(incrementFarmAlertBadgeAtom);
  const decrementAlertBadge = useSetAtom(decrementFarmAlertBadgeAtom);

  const [isLatestLoading, setIsLatestLoading] = useState(false);
  const [historyData, setHistoryData] = useState<SensorReadingDto[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inFlightLatestRef = useRef(false);
  const loadedFarmRef = useRef<string | null>(null);

  // Derived: latest readings từ Jotai atom cho farm này
  const latestReadings: SensorReadingDto[] =
    farmId ? (latestMap.get(farmId) ?? []) : [];

  // ── Cold start: load latest + alerts ───────────────────────────────────────
  useEffect(() => {
    if (!farmId) return;
    if (loadedFarmRef.current === farmId) return;
    if (inFlightLatestRef.current) return;

    let cancelled = false;
    inFlightLatestRef.current = true;
    setIsLatestLoading(true);
    setError(null);

    Promise.all([
      monitoringService.getLatest(farmId),
      monitoringService.listAlerts(farmId, { status: 'unacknowledged' }),
    ])
      .then(([readings, alertsRes]) => {
        if (cancelled) return;
        seedLatest({ farmId, readings });
        const unacked = alertsRes.items.filter((a) => !a.acknowledged);
        setAlerts(unacked);
        // Seed badge atom với số cảnh báo chưa acknowledge từ REST
        setAlertBadge({ farmId, count: unacked.length });
        loadedFarmRef.current = farmId;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toViMessage(err));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLatestLoading(false);
          inFlightLatestRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [farmId, seedLatest]);

  // Reset loaded guard when farmId changes
  useEffect(() => {
    loadedFarmRef.current = null;
  }, [farmId]);

  // ── WebSocket: sensor_update + alert_created ───────────────────────────────
  useEffect(() => {
    if (!farmId) return;

    const cleanupSensor = subscribeToFarm(farmId, (reading) => {
      mergeSensor(reading);
    });

    // Nhận alert_created từ server → thêm vào danh sách và tăng badge
    const cleanupAlert = subscribeToFarmAlerts(farmId, (newAlert) => {
      if (!newAlert.acknowledged) {
        setAlerts((prev) => {
          // Tránh duplicate nếu server push lại
          if (prev.some((a) => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });
        incrementAlertBadge(farmId);
      }
    });

    return () => {
      cleanupSensor();
      cleanupAlert();
    };
  }, [farmId, mergeSensor, incrementAlertBadge]);

  // ── Load history ───────────────────────────────────────────────────────────
  const loadHistory = useCallback(
    (sensorType: SensorType, extraParams?: Omit<HistoryParams, 'sensorType'>) => {
      if (!farmId) return;

      let cancelled = false;
      setIsHistoryLoading(true);

      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      monitoringService
        .getHistory(farmId, {
          from: from.toISOString(),
          to: now.toISOString(),
          interval: '1h',
          sensorType,
          ...extraParams,
        })
        .then((items) => {
          if (!cancelled) {
            setHistoryData(items);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(toViMessage(err));
        })
        .finally(() => {
          if (!cancelled) setIsHistoryLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [farmId],
  );

  // ── Acknowledge alert ──────────────────────────────────────────────────────
  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        await monitoringService.acknowledgeAlert(alertId);
        setAlerts((prev) => {
          const target = prev.find((a) => a.id === alertId);
          if (target && !target.acknowledged && farmId) {
            decrementAlertBadge(farmId);
          }
          return prev.filter((a) => a.id !== alertId);
        });
      } catch (err) {
        setError(toViMessage(err));
      }
    },
    [farmId, decrementAlertBadge],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    latestReadings,
    isLatestLoading,
    historyData,
    isHistoryLoading,
    alerts,
    error,
    loadHistory,
    acknowledgeAlert,
    clearError,
  };
}
