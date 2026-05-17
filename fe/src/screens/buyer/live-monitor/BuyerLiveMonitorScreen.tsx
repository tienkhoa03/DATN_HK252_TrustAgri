/**
 * BuyerLiveMonitorScreen — Phase 4 (FR-U05)
 * Route: /buyer/live
 *
 * Lists contracts with status active/deposited.
 * Each card navigates to /buyer/live/:contractId for detail view.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { BuyerHeader } from '../components/BuyerHeader';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listContracts,
  contractStatusLabelVi,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { productDisplayName } from '@/services/orderService';
import { contractFarmDisplay, partyTraderDisplay } from '@/utils/displayLabels';

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      padding: spacing.md,
      marginBottom: spacing.md,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    {[70, 50, 40].map((w, i) => (
      <div
        key={i}
        style={{
          height: '12px',
          width: `${w}%`,
          backgroundColor: colors.background.secondary,
          borderRadius: '6px',
          marginBottom: spacing.sm,
        }}
      />
    ))}
    <div style={{ height: '40px', backgroundColor: colors.background.secondary, borderRadius: '8px', marginTop: spacing.sm }} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

// FR-U05 — Tab Trực tiếp: list contracts đang đặt cọc có sensor
export const BuyerLiveMonitorScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listContracts({ role: 'buyer', page: 1, limit: 50 });
      // Keep only active/deposited contracts
      const active = res.items.filter(
        (c) => c.status === 'active' || (c.status as string) === 'deposited',
      );
      setContracts(active);
    } catch (err) {
      const msg = toContractViMessage(err, 'list');
      setError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const statusBadgeColor = (c: ContractDto) => {
    if (c.status === 'active') return colors.primary.agriGreen;
    return colors.functional.warningYellow;
  };

  return (
    <Page className="buyer-live-monitor-screen">
      <BuyerHeader title="Trực tiếp" />

      <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </>
        )}

        {!loading && error && contracts.length === 0 && (
          <EmptyState
            icon="⚠️"
            title="Không tải được dữ liệu"
            description={error}
            cta={{ label: 'Thử lại', onClick: load }}
          />
        )}

        {!loading && !error && contracts.length === 0 && (
          <EmptyState
            icon="🌱"
            title="Chưa có đơn đặt cọc nào"
            description="Đặt cọc để theo dõi vườn trồng của nông dân theo thời gian thực"
          />
        )}

        {!loading && contracts.map((c) => (
          <div
            key={c.id}
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '12px',
              padding: spacing.md,
              marginBottom: spacing.md,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  {c.productId ? productDisplayName(c.productId) : 'Sản phẩm'}
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
                  {partyTraderDisplay(c)}
                </Text>
                {contractFarmDisplay(c) && (
                  <Text size="xSmall" style={{ color: colors.text.primary, margin: `${spacing.xs} 0 0` }}>
                    Vườn: {contractFarmDisplay(c)}
                  </Text>
                )}
              </div>
              <span
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: `${statusBadgeColor(c)}18`,
                  color: statusBadgeColor(c),
                  borderRadius: '6px',
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  flexShrink: 0,
                  marginLeft: spacing.sm,
                }}
              >
                {contractStatusLabelVi(c.status)}
              </span>
            </div>

            {c.endDate && (
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: `0 0 ${spacing.md} 0` }}>
                Giao hàng: {new Date(c.endDate).toLocaleDateString('vi-VN')}
              </Text>
            )}

            <button
              onClick={() => navigate(`/buyer/live/${c.id}`)}
              style={{
                display: 'block',
                width: '100%',
                minHeight: '44px',
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.primary.agriGreen,
                color: colors.text.inverse,
                border: 'none',
                borderRadius: '8px',
                fontSize: fontSize.caption,
                fontWeight: fontWeight.semibold,
                cursor: 'pointer',
              }}
            >
              Xem trực tiếp →
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
};
