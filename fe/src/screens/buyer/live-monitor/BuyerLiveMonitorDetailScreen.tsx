/**
 * BuyerLiveMonitorDetailScreen — Phase 4 (FR-U05)
 * Route: /buyer/live/:contractId
 *
 * Người mua theo dõi vườn theo thời gian thực — chỉ xem, không sửa/xóa:
 *  - Header hợp đồng + vườn
 *  - Cảm biến thời gian thực (giống farmer: IotDashboardSection)
 *  - Quy trình chăm sóc theo tiêu chuẩn (giống farmer: TimelineSection ở chế độ readOnly)
 */

import React, { useEffect, useState } from 'react';
import { Page, Text, useNavigate, useParams } from 'zmp-ui';
import { BuyerHeader } from '../components/BuyerHeader';
import { IotDashboardSection, TimelineSection } from '@/screens/farmer/garden';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { getContract, type ContractDto } from '@/services/contractService';
import { getFarm, type FarmDto } from '@/services/farmService';
import { productDisplayName } from '@/services/orderService';
import { partyTraderDisplay } from '@/utils/displayLabels';

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
  const { contractId } = useParams<{ contractId: string }>();

  const [contract, setContract] = useState<ContractDto | null>(null);
  const [farm, setFarm] = useState<FarmDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const c = await getContract(contractId);
        if (!mounted) return;
        setContract(c);

        if (c.farmId) {
          try {
            const f = await getFarm(c.farmId);
            if (mounted) setFarm(f);
          } catch {
            // Non-critical: header chỉ hiển thị thông tin hợp đồng
          }
        }
      } catch {
        if (mounted) {
          openSnackbar({ type: 'error', text: 'Không tải được dữ liệu vườn. Vui lòng thử lại.', duration: 4000, icon: true });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

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

  const farmId = contract?.farmId ?? null;
  const standardId = farm?.standardId ?? contract?.standardId ?? undefined;

  return (
    <Page className="buyer-live-monitor-detail-screen">
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
      <BuyerHeader title="Vườn trực tiếp" />

      <div style={{ paddingBottom: 80 }}>
        {/* ── Contract + farm header ── */}
        <div style={{ padding: spacing.md }}>
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '12px',
              padding: spacing.md,
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
        </div>

        {loading ? (
          <div style={{ padding: `0 ${spacing.md}` }}>
            <div
              style={{ height: 200, backgroundColor: colors.background.secondary, borderRadius: 8 }}
              className="skeleton-pulse"
            />
          </div>
        ) : farmId ? (
          <>
            {/* ── Cảm biến thời gian thực (chỉ xem) ── */}
            <IotDashboardSection farmId={farmId} />

            <div style={{ height: 1, backgroundColor: colors.background.secondary, margin: `${spacing.md} 0 0` }} />

            {/* ── Quy trình chăm sóc (chỉ xem) ── */}
            <TimelineSection farmId={farmId} standardId={standardId} readOnly />

            {/* ── Mô hình 3D ── */}
            <div style={{ padding: spacing.md }}>
              <button
                onClick={() => navigate(`/buyer/live/${contractId}/twin`)}
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: 44,
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
          </>
        ) : (
          <div style={{ padding: spacing.md, textAlign: 'center' }}>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Hợp đồng chưa gắn vườn để theo dõi.
            </Text>
          </div>
        )}
      </div>
    </Page>
  );
};

export default BuyerLiveMonitorDetailScreen;
