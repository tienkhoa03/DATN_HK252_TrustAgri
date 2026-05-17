/**
 * SourcingInboxPanel — proposals received for a buying request
 *
 * Requirements: FR-U02, FR-T04, NFR-U03
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  getBuyingRequest,
  toBuyingRequestViMessage,
  type BuyingRequestDto,
} from '@/services/buyingRequestService';
import {
  listProposals,
  acceptProposal,
  rejectProposal,
  toProposalViMessage,
  type ProposalDto,
} from '@/services/proposalService';
import {
  ProposalComparisonTable,
  type ProposalItem,
} from '../components/ProposalComparisonTable';
import { proposalTraderDisplay } from '@/utils/displayLabels';

export interface SourcingInboxPanelProps {
  buyingRequestId: string;
  onBack: () => void;
}

function mapProposal(p: ProposalDto): ProposalItem {
  return {
    id: p.id,
    traderId: p.traderId,
    traderName: proposalTraderDisplay(p),
    pricePerUnit: p.price,
    quantity: p.quantity,
    deliveryDate: undefined,
    status: p.status,
  };
}

export const SourcingInboxPanel: React.FC<SourcingInboxPanelProps> = ({
  buyingRequestId,
  onBack,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [request, setRequest] = useState<BuyingRequestDto | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [req, prRes] = await Promise.all([
        getBuyingRequest(buyingRequestId),
        listProposals({ buyingRequestId }),
      ]);
      setRequest(req);
      setProposals(prRes.items.map(mapProposal));
    } catch (err: unknown) {
      const msg = toBuyingRequestViMessage(err, 'detail');
      setError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000 });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyingRequestId]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (proposalId: string) => {
    try {
      await acceptProposal(proposalId);
      openSnackbar({ text: 'Đã chấp nhận đề xuất!', type: 'success' });
      setProposals((prev) =>
        prev.map((p) => p.id === proposalId ? { ...p, status: 'accepted' } : p),
      );
    } catch (err) {
      openSnackbar({ text: toProposalViMessage(err, 'accept'), type: 'error', duration: 4000 });
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await rejectProposal(proposalId);
      openSnackbar({ text: 'Đã từ chối đề xuất.', type: 'info' });
      setProposals((prev) =>
        prev.map((p) => p.id === proposalId ? { ...p, status: 'rejected' } : p),
      );
    } catch (err) {
      openSnackbar({ text: toProposalViMessage(err, 'reject'), type: 'error', duration: 4000 });
    }
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
    minHeight: '56px',
  };

  const backBtnStyles: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: colors.background.secondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  };

  const summaryStyles: React.CSSProperties = {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '12px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={headerStyles}>
        <button type="button" style={backBtnStyles} onClick={onBack} aria-label="Quay lại">
          ←
        </button>
        <Text style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, flex: 1, margin: 0 }}>
          Đề xuất nhận được
        </Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: spacing.xl }}>
        {/* Buying request summary */}
        {request && (
          <div style={summaryStyles}>
            <Text style={{ fontSize: fontSize.caption, color: colors.text.secondary, margin: 0 }}>
              Yêu cầu mua
            </Text>
            <Text style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, margin: 0 }}>
              {request.cropType}
            </Text>
            <Text style={{ fontSize: fontSize.caption, color: colors.text.secondary, margin: 0 }}>
              {request.quantity.toLocaleString('vi-VN')} {request.unit}
              {request.expectedPrice
                ? ` · Giá kỳ vọng: ${request.expectedPrice.toLocaleString('vi-VN')} VNĐ`
                : ''}
            </Text>
            {request.description?.trim() && (
              <Text style={{ fontSize: fontSize.caption, color: colors.text.primary, margin: `${spacing.sm} 0 0`, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {request.description.trim()}
              </Text>
            )}
          </div>
        )}

        {/* Proposals */}
        {loading ? (
          <div style={{ padding: spacing.md }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{
                height: '140px',
                backgroundColor: colors.background.secondary,
                borderRadius: '12px',
                marginBottom: spacing.md,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: spacing.lg, textAlign: 'center' }}>
            <Text style={{ color: colors.functional.alertRed, fontSize: fontSize.caption }}>
              {error}
            </Text>
          </div>
        ) : (
          <div style={{ padding: `0 ${spacing.md}` }}>
            <ProposalComparisonTable
              proposals={proposals}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </div>
        )}
      </div>
    </div>
  );
};
