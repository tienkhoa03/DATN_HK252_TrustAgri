/**
 * TraderFarmMonitoringScreen — Phase 4 Trader UI Refactor
 * FR-T11, FR-T08, NFR-U01, NFR-U03, NFR-A01, NFR-R02
 *
 * - Lists active-contract farms with compliance traffic-light cards
 * - Supports `?filter=alert` URL param to show only non-green farms
 * - Tapping a card opens FarmMonitoringDetail inline (slide-down below list)
 * - Header CTA navigates to /trader/standards (Thư viện quy trình)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Page, Text, Spinner, useNavigate } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { Icon } from '@/design-system/components/Icon';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listContracts,
  getContractCompliance,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { getFarm, type FarmDto } from '@/services/farmService';
import { searchFarmers, type FarmerSearchResultDto } from '@/services/connectionService';
import { FarmTrafficLightCard } from './components/FarmTrafficLightCard';
import { FarmMonitoringDetail } from './components/FarmMonitoringDetail';
import { farmOwnerDisplay } from '@/utils/displayLabels';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FarmMonitoringItem {
  farm: FarmDto;
  farmerName: string;
  contractId: string;
  complianceScore: number;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
    className="skeleton-pulse"
    aria-hidden="true"
  >
    <div style={{ height: '18px', width: '55%', backgroundColor: colors.background.secondary, borderRadius: 4, marginBottom: spacing.sm }} />
    <div style={{ height: '14px', width: '35%', backgroundColor: colors.background.secondary, borderRadius: 4, marginBottom: spacing.sm }} />
    <div style={{ height: '6px', width: '100%', backgroundColor: colors.background.secondary, borderRadius: 2 }} />
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export function TraderFarmMonitoringScreen() {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();

  const [items, setItems] = useState<FarmMonitoringItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FarmMonitoringItem | null>(null);
  const loadedRef = useRef(false);

  // Read URL filter param (?filter=alert)
  const alertFilter = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('filter') === 'alert'
    : false;

  const loadData = useCallback(async () => {
    if (loadedRef.current) return;
    setIsLoading(true);
    try {
      // 1) Active contracts for trader
      const contractRes = await listContracts({ role: 'trader', status: 'active', page: 1, limit: 100 });
      const contracts: ContractDto[] = contractRes.items.filter((c) => !!c.farmId);

      if (contracts.length === 0) {
        setItems([]);
        loadedRef.current = true;
        return;
      }

      // 2) Farmer name lookup map (best-effort)
      let farmerMap: Record<string, string> = {};
      try {
        const farmerRes = await searchFarmers({ page: 1, limit: 200 });
        farmerRes.items.forEach((f: FarmerSearchResultDto) => {
          farmerMap[f.userId] = f.displayName;
        });
      } catch {
        // fallback: use ownerId slice
      }

      // 3) Fetch farms + compliance in parallel (guard individual failures)
      const rawResults: Array<FarmMonitoringItem | null> = await Promise.all(
        contracts.map(async (c): Promise<FarmMonitoringItem | null> => {
          let farmData: FarmDto;
          try {
            farmData = await getFarm(c.farmId!);
          } catch {
            return null;
          }
          let score = 0;
          try {
            const compliance = await getContractCompliance(c.id);
            score = compliance.complianceScore;
          } catch {
            // compliance unavailable — default 0
          }
          const farmerName =
            farmOwnerDisplay(farmData, farmerMap[farmData.ownerId]);
          return {
            farm: farmData,
            farmerName,
            contractId: c.id,
            complianceScore: score,
          };
        }),
      );

      const resolved = rawResults.filter((x): x is FarmMonitoringItem => x !== null);

      // Sort: lowest score first (alerts at top)
      resolved.sort((a, b) => a.complianceScore - b.complianceScore);
      setItems(resolved);
      loadedRef.current = true;
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toContractViMessage(err, 'list'),
        duration: 4500,
        icon: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Apply alert filter
  const displayedItems = alertFilter
    ? items.filter((i) => i.complianceScore < 0.8)
    : items;

  const handleCardTap = (item: FarmMonitoringItem) => {
    setSelectedItem((prev) => (prev?.farm.id === item.farm.id ? null : item));
  };

  const handleRefresh = () => {
    loadedRef.current = false;
    setSelectedItem(null);
    void loadData();
  };

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <Page className="trader-farm-monitoring-screen">
        {/* Header */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            borderBottom: `1px solid ${colors.background.secondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Text
              size="small"
              style={{ color: colors.text.secondary, margin: 0 }}
            >
              Giám sát Vùng trồng
            </Text>
            <Text.Title
              size="normal"
              style={{ margin: 0, fontWeight: fontWeight.semibold }}
            >
              Đối chiếu Tuân thủ
            </Text.Title>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Tải lại"
              style={{
                background: 'none',
                border: `1px solid ${colors.background.tertiary}`,
                borderRadius: '8px',
                padding: spacing.xs,
                minWidth: '44px',
                minHeight: '44px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSize.caption,
                color: colors.text.secondary,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              ↺
            </button>

            {/* Thư viện quy trình — CTA nổi bật */}
            <button
              type="button"
              onClick={() => navigate('/trader/standards')}
              aria-label="Thư viện quy trình"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: colors.primary.agriGreen,
                color: colors.text.inverse,
                border: 'none',
                borderRadius: 8,
                minHeight: 44,
                cursor: 'pointer',
                fontSize: fontSize.caption,
                fontWeight: fontWeight.semibold,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.35)',
              }}
            >
              <Icon name="book" size="sm" color={colors.text.inverse} />
              Thư viện quy trình
            </button>
          </div>
        </div>

        {/* Alert filter banner */}
        {alertFilter && (
          <div
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: `${colors.functional.alertRed}10`,
              borderBottom: `1px solid ${colors.functional.alertRed}30`,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Icon name="alert-triangle" size="sm" color={colors.functional.alertRed} />
            <Text
              size="small"
              style={{ color: colors.functional.alertRed, margin: 0 }}
            >
              Chỉ hiển thị vườn cần theo dõi / cảnh báo
            </Text>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
          {/* Summary count */}
          {!isLoading && items.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: spacing.md,
                marginBottom: spacing.md,
                flexWrap: 'wrap',
              }}
            >
              {[
                {
                  label: 'Tốt',
                  count: items.filter((i) => i.complianceScore >= 0.8).length,
                  color: colors.primary.agriGreen,
                },
                {
                  label: 'Theo dõi',
                  count: items.filter(
                    (i) => i.complianceScore >= 0.5 && i.complianceScore < 0.8,
                  ).length,
                  color: colors.functional.warningYellow,
                },
                {
                  label: 'Cảnh báo',
                  count: items.filter((i) => i.complianceScore < 0.5).length,
                  color: colors.functional.alertRed,
                },
              ].map(({ label, count, color }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    minWidth: '80px',
                    padding: spacing.sm,
                    backgroundColor: `${color}10`,
                    borderRadius: '8px',
                    border: `1px solid ${color}30`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSize.h2,
                      fontWeight: fontWeight.bold,
                      color,
                    }}
                  >
                    {count}
                  </div>
                  <div style={{ fontSize: fontSize.small, color: colors.text.secondary }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                <Spinner />
                <Text
                  size="small"
                  style={{ color: colors.text.secondary }}
                >
                  Đang tải dữ liệu vùng trồng…
                </Text>
              </div>
              {[1, 2, 3].map((k) => (
                <SkeletonCard key={k} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && displayedItems.length === 0 && (
            <EmptyState
              icon="🌱"
              title={
                alertFilter
                  ? 'Không có vườn cần cảnh báo'
                  : 'Chưa có vườn nào'
              }
              description={
                alertFilter
                  ? 'Tất cả vườn đang trong tình trạng tốt.'
                  : 'Khi bạn có hợp đồng đã ký kết với nông dân, vườn sẽ hiển thị tại đây.'
              }
              // cta={
              //   alertFilter
              //     ? undefined
              //     : {
              //         label: 'Tìm nông dân',
              //         onClick: () => navigate('/trader/supply'),
              //       }
              // }
            />
          )}

          {/* Farm cards */}
          {!isLoading &&
            displayedItems.map((item) => (
              <div key={item.farm.id}>
                <FarmTrafficLightCard
                  farmName={item.farm.name}
                  farmerName={item.farmerName}
                  cropType={item.farm.cropType}
                  province={item.farm.location?.province}
                  complianceScore={item.complianceScore}
                  onTap={() => handleCardTap(item)}
                />

                {/* Inline detail panel */}
                {selectedItem?.farm.id === item.farm.id && (
                  <FarmMonitoringDetail
                    farmId={item.farm.id}
                    farmName={item.farm.name}
                    cropType={item.farm.cropType}
                    onClose={() => setSelectedItem(null)}
                  />
                )}
              </div>
            ))}
        </div>
      </Page>
    </>
  );
}

export default TraderFarmMonitoringScreen;
