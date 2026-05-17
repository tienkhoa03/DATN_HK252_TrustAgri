/**
 * BuyerLiveMonitorDetailScreen — Phase 4 (FR-U05)
 * Route: /buyer/live/:contractId
 *
 * Shows:
 *  - Contract + farm header info
 *  - 3 SemanticSensorCards (temperature, soil_moisture, light)
 *  - FarmActionTimeline from care-logs
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { BuyerHeader } from '../components/BuyerHeader';
import { SemanticSensorCard, computeTemperatureStatus, computeSoilMoistureStatus, computeLightStatus, type SensorStatus } from './components/SemanticSensorCard';
import { FarmActionTimeline, type CareLogEntry } from './components/FarmActionTimeline';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { getContract, type ContractDto } from '@/services/contractService';
import { getFarm, type FarmDto } from '@/services/farmService';
import { listCareLogs, type CareLogDto } from '@/services/careLogService';
import { getLatest, type SensorReadingDto } from '@/services/monitoringService';
import { productDisplayName } from '@/services/orderService';
import { farmDisplayLabel, partyTraderDisplay } from '@/utils/displayLabels';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract :contractId from the current URL path /buyer/live/:contractId */
function getContractIdFromPath(): string {
  try {
    const parts = window.location.pathname.split('/');
    // /buyer/live/:contractId
    const liveIdx = parts.indexOf('live');
    if (liveIdx !== -1 && parts[liveIdx + 1]) return parts[liveIdx + 1];
  } catch {
    // ignore
  }
  return '';
}

function mapActionLabel(action: string): string {
  const map: Record<string, string> = {
    watering: 'Tưới nước',
    fertilizing: 'Bón phân',
    pest_control: 'Phòng trừ sâu bệnh',
    pruning: 'Cắt tỉa',
    harvesting: 'Thu hoạch',
    inspection: 'Kiểm tra vườn',
  };
  return map[action] ?? action;
}

function careLogToTimelineEntry(log: CareLogDto): CareLogEntry {
  return {
    id: log.id,
    actorName: undefined, // CareLogDto doesn't have actorName; BE returns farmerId via JWT
    actorAvatar: undefined,
    timestamp: log.performedAt,
    action: mapActionLabel(log.action),
    imageUrl: log.evidences?.[0]?.fileUrl,
    notes: log.notes,
  };
}

interface SensorSnapshot {
  temperature: { value: number | null; isImputed: boolean; status: SensorStatus };
  soilMoisture: { value: number | null; isImputed: boolean; status: SensorStatus };
  light: { value: number | null; isImputed: boolean; status: SensorStatus };
}

function buildSensorSnapshot(readings: SensorReadingDto[]): SensorSnapshot {
  const find = (type: string) => readings.find((r) => r.sensorType === type);
  const tempReading = find('temperature');
  const moistReading = find('soil_moisture');
  const lightReading = find('light');

  return {
    temperature: {
      value: tempReading?.value ?? null,
      isImputed: tempReading?.isImputed ?? false,
      status: tempReading != null ? computeTemperatureStatus(tempReading.value) : 'attention',
    },
    soilMoisture: {
      value: moistReading?.value ?? null,
      isImputed: moistReading?.isImputed ?? false,
      status: moistReading != null ? computeSoilMoistureStatus(moistReading.value) : 'attention',
    },
    light: {
      value: lightReading?.value ?? null,
      isImputed: lightReading?.isImputed ?? false,
      status: lightReading != null ? computeLightStatus(lightReading.value) : 'attention',
    },
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBar: React.FC<{ width?: string }> = ({ width = '60%' }) => (
  <div
    style={{
      height: '12px',
      width,
      backgroundColor: colors.background.tertiary,
      borderRadius: '6px',
      marginBottom: spacing.xs,
    }}
  />
);

// ── Main component ────────────────────────────────────────────────────────────

export const BuyerLiveMonitorDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const contractId = getContractIdFromPath();

  const [contract, setContract] = useState<ContractDto | null>(null);
  const [farm, setFarm] = useState<FarmDto | null>(null);
  const [sensors, setSensors] = useState<SensorSnapshot | null>(null);
  const [careLogEntries, setCareLogEntries] = useState<CareLogEntry[]>([]);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);

  const PAGE_SIZE = 10;

  const loadCareLogs = useCallback(async (farmId: string, page: number) => {
    setLogLoading(true);
    try {
      const res = await listCareLogs(farmId, { page, limit: PAGE_SIZE });
      const entries = res.items.map(careLogToTimelineEntry);
      setCareLogEntries((prev) => page === 1 ? entries : [...prev, ...entries]);
      setHasMoreLogs(res.total > page * PAGE_SIZE);
    } catch {
      // Non-critical: swallow error, timeline shows empty
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contractId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // Load contract first
        const c = await getContract(contractId);
        if (!mounted) return;
        setContract(c);

        // Parallel: farm + sensors (if farmId known)
        const promises: Promise<void>[] = [];

        if (c.farmId) {
          promises.push(
            getFarm(c.farmId)
              .then((f) => { if (mounted) setFarm(f); })
              .catch(() => {}),
          );
          promises.push(
            getLatest(c.farmId)
              .then((readings) => { if (mounted) setSensors(buildSensorSnapshot(readings)); })
              .catch(() => { if (mounted) setSensors(buildSensorSnapshot([])); }),
          );
          promises.push(
            loadCareLogs(c.farmId, 1).catch(() => {}),
          );
        } else {
          setSensors(buildSensorSnapshot([]));
        }

        await Promise.all(promises.map((p) => p.catch(() => {})));
      } catch (err) {
        if (mounted) {
          openSnackbar({ type: 'error', text: 'Không tải được dữ liệu vườn. Vui lòng thử lại.', duration: 4000, icon: true });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const handleLoadMore = () => {
    if (farm && !logLoading) {
      const nextPage = logPage + 1;
      setLogPage(nextPage);
      loadCareLogs(farm.id, nextPage);
    }
  };

  if (!contractId) {
    return (
      <Page>
        <BuyerHeader title="Vườn trực tiếp" />
        <div style={{ padding: spacing.md, textAlign: 'center' }}>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Không tìm thấy thông tin hợp đồng.
          </Text>
        </div>
      </Page>
    );
  }

  return (
    <Page className="buyer-live-monitor-detail-screen">
      <BuyerHeader title="Vườn trực tiếp" />

      <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
        {/* ── Contract + farm header ── */}
        <div
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: '12px',
            padding: spacing.md,
            marginBottom: spacing.md,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {loading ? (
            <>
              <SkeletonBar width="70%" />
              <SkeletonBar width="50%" />
              <SkeletonBar width="60%" />
            </>
          ) : (
            <>
              <Text
                size="small"
                style={{ fontWeight: fontWeight.bold, margin: `0 0 ${spacing.xs} 0`, fontSize: fontSize.body }}
              >
                {contract?.productId ? productDisplayName(contract.productId) : 'Sản phẩm'}
              </Text>
              {farm && (
                <Text size="small" style={{ color: colors.text.secondary, margin: `0 0 ${spacing.xs} 0` }}>
                  {farm.name} · {farm.location?.province ?? ''}
                </Text>
              )}
              {contract?.partyTraderId && (
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Thương lái: {partyTraderDisplay(contract)}
                </Text>
              )}
              {contract?.endDate && (
                <Text size="xSmall" style={{ color: colors.primary.agriGreen, margin: `${spacing.xs} 0 0` }}>
                  Dự kiến giao: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                </Text>
              )}
            </>
          )}
        </div>

        {/* ── Sensor cards ── */}
        <Text
          size="small"
          style={{ fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.sm} 0`, display: 'block', color: colors.text.primary }}
        >
          Dữ liệu cảm biến
        </Text>
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
          {loading || sensors === null ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100px',
                    backgroundColor: colors.background.tertiary,
                    borderRadius: '12px',
                  }}
                />
              ))}
            </>
          ) : (
            <>
              <SemanticSensorCard
                label="Nhiệt độ"
                value={sensors.temperature.value}
                unit="°C"
                status={sensors.temperature.status}
                isImputed={sensors.temperature.isImputed}
              />
              <SemanticSensorCard
                label="Độ ẩm đất"
                value={sensors.soilMoisture.value}
                unit="%"
                status={sensors.soilMoisture.status}
                isImputed={sensors.soilMoisture.isImputed}
              />
              <SemanticSensorCard
                label="Ánh sáng"
                value={sensors.light.value}
                unit=" lux"
                status={sensors.light.status}
                isImputed={sensors.light.isImputed}
              />
            </>
          )}
        </div>

        {/* ── Care log timeline ── */}
        <Text
          size="small"
          style={{ fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.sm} 0`, display: 'block', color: colors.text.primary }}
        >
          Hoạt động canh tác
        </Text>
        <div
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: '12px',
            padding: spacing.md,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: spacing.md,
          }}
        >
          <FarmActionTimeline
            entries={careLogEntries}
            loading={loading || logLoading}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreLogs}
          />
        </div>

        {/* ── Future: 3D twin link ── */}
        <button
          onClick={() => navigate(`/buyer/live/${contractId}/twin`)}
          style={{
            display: 'block',
            width: '100%',
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'transparent',
            border: `1px solid ${colors.background.tertiary}`,
            borderRadius: '8px',
            color: colors.text.secondary,
            fontSize: fontSize.small,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Xem mô hình 3D →
        </button>
      </div>
    </Page>
  );
};

export default BuyerLiveMonitorDetailScreen;
