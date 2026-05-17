/**
 * FarmerGardenListScreen — danh sách vườn của nông dân (FR-F07, FR-F09)
 * Bấm vào vườn → màn giám sát chi tiết.
 * Nút "Quản lý vườn" → bottom sheet CRUD (chỉ sửa/xóa vườn không có contract active).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { listFarms, type FarmDto } from '@/services/farmService';
import { listContracts } from '@/services/contractService';
import { getTodayPlan } from '@/services/carePlanService';
import { listAlerts } from '@/services/monitoringService';
import { listStandards } from '@/services/standardService';
import { EmptyState } from '@/design-system/components/EmptyState';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { FarmLabSection } from '@/screens/farmer/profile/FarmLabSection';
import { CROP_TYPE_LABELS } from '@/screens/trader/farm-monitoring/components/FarmTrafficLightCard';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ApiError } from '@/api/errors';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

export interface FarmListItem {
  farm: FarmDto;
  statusLabel: string;
  statusColor: string;
  standardLabel: string;
}

async function resolveFarmListItem(
  farm: FarmDto,
  standardNames: Map<string, string>,
): Promise<FarmListItem> {
  let statusLabel = 'Đang canh tác';
  let statusColor = colors.primary.agriGreen;

  const standardLabel = farm.standardId
    ? (standardNames.get(farm.standardId) ?? 'Tiêu chuẩn đã gán')
    : 'Chưa gán tiêu chuẩn';

  if (!farm.standardId) {
    statusLabel = 'Chưa gán tiêu chuẩn';
    statusColor = colors.text.secondary;
  } else {
    try {
      const alertsRes = await listAlerts(farm.id, { status: 'unacknowledged', page: 1, limit: 1 });
      if (alertsRes.items.length > 0) {
        statusLabel = 'Có cảnh báo cảm biến';
        statusColor = colors.functional.alertRed;
      }
    } catch {
      // bỏ qua — dùng trạng thái care plan
    }

    if (statusLabel === 'Đang canh tác') {
      try {
        const plan = await getTodayPlan(farm.id);
        const pending = plan.tasks.filter((t) => !t.completed);
        if (plan.tasks.length === 0) {
          statusLabel = 'Chưa có việc hôm nay';
          statusColor = colors.text.secondary;
        } else if (pending.length === 0) {
          statusLabel = 'Hoàn thành việc hôm nay';
          statusColor = colors.primary.agriGreen;
        } else {
          statusLabel = pending[0].title;
          statusColor = colors.functional.warningYellow;
        }
      } catch {
        statusLabel = 'Đang canh tác';
        statusColor = colors.primary.agriGreen;
      }
    }
  }

  return { farm, statusLabel, statusColor, standardLabel };
}

const SkeletonCard: React.FC = () => (
  <div
    className="skeleton-pulse"
    style={{
      height: 96,
      backgroundColor: colors.background.secondary,
      borderRadius: 10,
      marginBottom: spacing.md,
    }}
    aria-hidden="true"
  />
);

interface FarmCardProps {
  item: FarmListItem;
  onSelect: (farmId: string) => void;
}

const FarmCard: React.FC<FarmCardProps> = ({ item, onSelect }) => {
  const { farm, statusLabel, statusColor, standardLabel } = item;
  const cropLabel = CROP_TYPE_LABELS[farm.cropType] ?? farm.cropType;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(farm.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(farm.id)}
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        padding: spacing.md,
        cursor: 'pointer',
        minHeight: 44,
        border: `1px solid ${colors.background.tertiary}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            {farm.name}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: 2, display: 'block' }}>
            {cropLabel} · {farm.area.toLocaleString('vi-VN')} m²
          </Text>
          <Text
            size="xSmall"
            style={{
              color: colors.primary.agriGreen,
              marginTop: spacing.xs,
              display: 'block',
              fontSize: fontSize.caption,
            }}
          >
            📋 {standardLabel}
          </Text>
        </div>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            borderRadius: 6,
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            whiteSpace: 'nowrap',
            maxWidth: '42%',
            textAlign: 'right',
            lineHeight: 1.3,
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

export const FarmerGardenListScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  const [items, setItems] = useState<FarmListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const [showManage, setShowManage] = useState(false);
  const [lockedFarmIds, setLockedFarmIds] = useState<Set<string>>(new Set());
  const [manageLoading, setManageLoading] = useState(false);

  const loadFarms = useCallback(async () => {
    if (!session?.userId) return;
    setLoading(true);
    try {
      const [farmRes, stdRes] = await Promise.all([
        listFarms({ ownerId: session.userId, page: 1, limit: 50 }),
        listStandards({ page: 1, limit: 200 }),
      ]);
      const standardNames = new Map(stdRes.items.map((s) => [s.id, s.name]));
      const enriched = await Promise.all(
        farmRes.items.map((farm) => resolveFarmListItem(farm, standardNames)),
      );
      setItems(enriched);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'NETWORK_ERROR'
          ? 'Không có phản hồi từ máy chủ.'
          : 'Không thể tải danh sách vườn.';
      openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session?.userId, openSnackbar]);

  useEffect(() => {
    if (!session?.userId || loadedRef.current) return;
    loadedRef.current = true;
    void loadFarms();
  }, [session?.userId, loadFarms]);

  const handleSelectFarm = (farmId: string) => {
    navigate(`/farmer/garden/${farmId}`);
  };

  const handleOpenManage = async () => {
    setManageLoading(true);
    try {
      const res = await listContracts({ role: 'farmer', status: 'active', limit: 100 });
      const ids = new Set<string>();
      for (const c of res.items) {
        if (c.farmId) ids.add(c.farmId);
      }
      setLockedFarmIds(ids);
    } catch {
      setLockedFarmIds(new Set());
    } finally {
      setManageLoading(false);
    }
    setShowManage(true);
  };

  return (
    <Page className="farmer-garden-list-screen">
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
      <ConnectionStatusBanner />
      <div style={{ padding: spacing.md, paddingBottom: 80 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text.Title size="normal" style={{ margin: 0 }}>
            Vườn trồng
          </Text.Title>
          <button
            type="button"
            onClick={handleOpenManage}
            disabled={manageLoading}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.primary.agriGreen,
              color: colors.text.inverse,
              border: 'none', borderRadius: 8,
              fontSize: fontSize.caption, fontWeight: fontWeight.medium,
              cursor: manageLoading ? 'not-allowed' : 'pointer',
              minHeight: 36, display: 'flex', alignItems: 'center', gap: spacing.xs,
            }}
          >
            {manageLoading ? '…' : '🌿 Quản lý vườn'}
          </button>
        </div>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.md, display: 'block' }}>
          Chọn vườn để xem cảm biến và quy trình chăm sóc
        </Text>

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && items.length === 0 && (
          <EmptyState
            icon="🌱"
            title="Chưa có vườn nào"
            description={'Nhấn "Quản lý vườn" để tạo hồ sơ vườn đầu tiên.'}
            cta={{ label: 'Tạo vườn ngay', onClick: handleOpenManage }}
          />
        )}

        {!loading &&
          items.map((item) => (
            <FarmCard key={item.farm.id} item={item} onSelect={handleSelectFarm} />
          ))}
      </div>

      {/* Bottom sheet: Quản lý vườn */}
      {showManage && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
          onClick={() => setShowManage(false)}
        >
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '16px 16px 0 0',
              maxHeight: '85vh',
              overflowY: 'auto',
              paddingBottom: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
              borderBottom: `1px solid ${colors.background.secondary}`,
              position: 'sticky', top: 0, backgroundColor: colors.background.primary, zIndex: 1,
            }}>
              <Text.Title size="small" style={{ margin: 0 }}>Quản lý vườn</Text.Title>
              <button
                type="button"
                onClick={() => setShowManage(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: colors.background.secondary,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: fontSize.caption, color: colors.text.secondary,
                }}
              >
                ✕
              </button>
            </div>

            <FarmLabSection
              ownerId={session?.userId}
              lockedFarmIds={lockedFarmIds}
              inModal
            />
          </div>
        </div>
      )}
    </Page>
  );
};

export default FarmerGardenListScreen;
