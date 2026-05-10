/**
 * RenegotiationCard — Phase 3 (FR-U04)
 * Card with yellow banner + slide-up modal showing ContractDiffView.
 * Calls contractChangeRequestService on approve/reject.
 */

import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { ContractDiffView } from './ContractDiffView';
import type { ContractTermsSnapshot } from './ContractDiffView';
import {
  acceptContractChangeRequest,
  rejectContractChangeRequest,
  toContractChangeRequestViMessage,
} from '@/services/contractChangeRequestService';

export interface ContractChangeRequest {
  id: string;
  contractId: string;
  status: 'pending' | 'approved' | 'rejected';
  before: ContractTermsSnapshot;
  after: ContractTermsSnapshot;
  requestedAt: string;
  requestedBy?: string;
}

export interface RenegotiationCardProps {
  changeRequest: ContractChangeRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const RenegotiationCard: React.FC<RenegotiationCardProps> = ({
  changeRequest,
  onApprove,
  onReject,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [showDiff, setShowDiff] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await acceptContractChangeRequest(changeRequest.contractId, changeRequest.id);
      openSnackbar({ type: 'success', text: 'Đã đồng ý thay đổi điều khoản.', duration: 3000, icon: true });
      setShowDiff(false);
      onApprove(changeRequest.id);
    } catch (err: unknown) {
      const msg = toContractChangeRequestViMessage(err, 'accept');
      openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectContractChangeRequest(changeRequest.contractId, changeRequest.id);
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu thay đổi.', duration: 3000, icon: true });
      setShowDiff(false);
      onReject(changeRequest.id);
    } catch (err: unknown) {
      const msg = toContractChangeRequestViMessage(err, 'reject');
      openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
    } finally {
      setIsLoading(false);
    }
  };

  const ageLabel = (() => {
    const ms = Date.now() - new Date(changeRequest.requestedAt).getTime();
    const h = Math.floor(ms / 3600000);
    const d = Math.floor(ms / 86400000);
    if (d >= 1) return `${d} ngày trước`;
    if (h >= 1) return `${h} giờ trước`;
    return 'Vừa xong';
  })();

  return (
    <>
      {/* Banner card */}
      <div
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: spacing.md,
        }}
      >
        {/* Yellow top banner */}
        <div
          style={{
            backgroundColor: `${colors.functional.warningYellow}25`,
            borderLeft: `4px solid ${colors.functional.warningYellow}`,
            padding: `${spacing.sm} ${spacing.md}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Text
              size="small"
              style={{
                fontWeight: fontWeight.semibold,
                color: '#8B6914',
                margin: 0,
              }}
            >
              Yêu cầu thay đổi điều khoản
            </Text>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              {ageLabel}
              {changeRequest.requestedBy ? ` · ${changeRequest.requestedBy}` : ''}
            </Text>
          </div>
          <button
            onClick={() => setShowDiff(true)}
            style={{
              flexShrink: 0,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.functional.warningYellow,
              color: '#5C4A00',
              border: 'none',
              borderRadius: '6px',
              fontSize: fontSize.small,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
              minHeight: '36px',
            }}
          >
            Xem so sánh →
          </button>
        </div>
      </div>

      {/* Slide-up modal overlay */}
      {showDiff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
            onClick={() => !isLoading && setShowDiff(false)}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'relative',
              backgroundColor: colors.background.primary,
              borderRadius: '20px 20px 0 0',
              padding: spacing.md,
              maxHeight: '85vh',
              overflowY: 'auto',
              zIndex: 1,
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: colors.background.tertiary,
                margin: `0 auto ${spacing.md}`,
              }}
            />

            <Text.Title size="normal" style={{ margin: `0 0 ${spacing.md} 0`, fontWeight: fontWeight.semibold }}>
              So sánh điều khoản
            </Text.Title>

            <ContractDiffView
              before={changeRequest.before}
              after={changeRequest.after}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};
