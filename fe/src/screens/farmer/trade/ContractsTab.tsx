/**
 * ContractsTab — contracts list with segmented pills (FR-F04, FR-T09)
 */

import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import { EmptyState } from '@/design-system/components/EmptyState';
import { ContractDetailModal } from '@/screens/trader/transactions/components/ContractDetailModal';
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
import { ContractDiffModal } from './ContractDiffModal';

type PillKey = 'pending' | 'active' | 'history';

const PILL_LABELS: Record<PillKey, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang chạy',
  history: 'Lịch sử',
};

function filterContracts(contracts: ContractDto[], pill: PillKey): ContractDto[] {
  switch (pill) {
    case 'pending':
      return contracts.filter((c) => c.status === 'pending_change' || c.status === 'pending_signature');
    case 'active':
      return contracts.filter((c) => c.status === 'active');
    case 'history':
      return contracts.filter((c) => c.status === 'completed' || c.status === 'cancelled');
    default:
      return contracts;
  }
}

function pillCount(contracts: ContractDto[], pill: PillKey): number {
  return filterContracts(contracts, pill).length;
}

export const ContractsTab: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePill, setActivePill] = useState<PillKey>('active');
  const [diffModal, setDiffModal] = useState<{ open: boolean; contract?: ContractDto }>({ open: false });
  const [detailModal, setDetailModal] = useState<ContractDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listContracts({ role: 'farmer', limit: 50 })
      .then((res) => { if (!cancelled) { setContracts(res.items); setLoading(false); } })
      .catch((err) => {
        if (!cancelled) {
          openSnackbar({ type: 'error', text: toContractViMessage(err, 'list'), duration: 3500, icon: true });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [openSnackbar]);

  const handleContractUpdated = (updated: ContractDto) => {
    setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setDetailModal(updated);
  };

  const visible = filterContracts(contracts, activePill);

  return (
    <div>
      {/* Segmented pills */}
      <div style={{ display: 'flex', gap: spacing.xs, padding: `${spacing.sm} ${spacing.md}` }}>
        {(Object.keys(PILL_LABELS) as PillKey[]).map((pill) => {
          const count = pillCount(contracts, pill);
          const isActive = activePill === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setActivePill(pill)}
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: 20,
                border: `1px solid ${isActive ? colors.primary.zaloBlue : colors.background.secondary}`,
                backgroundColor: isActive ? `${colors.primary.zaloBlue}18` : colors.background.secondary,
                color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
                fontSize: fontSize.small,
                fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
                minHeight: 44,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {PILL_LABELS[pill]}
              {count > 0 && (
                <span style={{
                  backgroundColor: isActive ? colors.primary.zaloBlue : colors.text.secondary,
                  color: colors.text.inverse,
                  borderRadius: 10,
                  fontSize: '10px',
                  fontWeight: fontWeight.bold,
                  padding: '1px 5px',
                  lineHeight: 1.4,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>Đang tải…</span>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon="📄"
          title="Không có hợp đồng"
          description={`Chưa có hợp đồng nào ở trạng thái "${PILL_LABELS[activePill]}".`}
        />
      )}

      {!loading && visible.map((contract) => {
        const isPendingChange = contract.status === 'pending_change';
        const isPendingSignature = contract.status === 'pending_signature';
        const isClickable = isPendingChange || isPendingSignature;

        return (
          <button
            key={contract.id}
            type="button"
            onClick={() => {
              if (isPendingChange) setDiffModal({ open: true, contract });
              else if (isPendingSignature) setDetailModal(contract);
            }}
            style={{
              display: 'block',
              width: '100%',
              margin: `0 ${spacing.md} ${spacing.sm}`,
              padding: spacing.md,
              backgroundColor: colors.background.primary,
              border: `1px solid ${
                isPendingSignature ? colors.primary.zaloBlue
                : isPendingChange ? colors.functional.warningYellow
                : colors.background.secondary}`,
              borderRadius: 10,
              cursor: isClickable ? 'pointer' : 'default',
              textAlign: 'left',
              boxSizing: 'border-box',
              maxWidth: `calc(100% - ${spacing.xl})`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                #{contract.id.slice(0, 8)}
              </Text>
              <span style={{
                fontSize: fontSize.small,
                fontWeight: fontWeight.medium,
                color: isPendingSignature ? colors.primary.zaloBlue
                  : isPendingChange ? colors.functional.warningYellow
                  : contract.status === 'active' ? colors.primary.agriGreen
                  : colors.text.secondary,
              }}>
                {contractStatusLabelVi(contract.status)}
              </span>
            </div>
            <Text.Title size="small" style={{ margin: `0 0 ${spacing.xs}` }}>
              {contract.quantity} {contract.unit} × {contract.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              Đến: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
            </Text>
            {isPendingSignature && (
              <div style={{ marginTop: spacing.xs, fontSize: fontSize.small, color: colors.primary.zaloBlue, fontWeight: fontWeight.medium }}>
                Nhấn để ký hợp đồng →
              </div>
            )}
            {isPendingChange && (
              <div style={{ marginTop: spacing.xs, fontSize: fontSize.small, color: colors.functional.warningYellow, fontWeight: fontWeight.medium }}>
                Nhấn để xem yêu cầu thay đổi →
              </div>
            )}
          </button>
        );
      })}

      {/* Contract detail modal with sign button */}
      {detailModal && (
        <ContractDetailModal
          visible
          contract={detailModal}
          onClose={() => setDetailModal(null)}
          onSigned={handleContractUpdated}
          onRejected={(updated) => {
            setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setDetailModal(null);
          }}
        />
      )}

      {/* Diff modal for pending_change */}
      {diffModal.open && diffModal.contract && (
        <ContractDiffModal
          open={diffModal.open}
          onClose={() => setDiffModal({ open: false })}
          contract={diffModal.contract}
        />
      )}
    </div>
  );
};

export default ContractsTab;
