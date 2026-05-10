/**
 * ProposalComparisonTable — mobile-friendly list of trader proposals
 * Highlights best price (lowest) and best trust score
 *
 * Requirements: FR-U02, FR-T04, NFR-U03
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface ProposalItem {
  id: string;
  traderId: string;
  traderName: string;
  traderAvatar?: string;
  traderTrustScore?: number;
  pricePerUnit: number;
  quantity: number;
  farmName?: string;
  deliveryDate?: string;
  status: string;
}

export interface ProposalComparisonTableProps {
  proposals: ProposalItem[];
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

function trustScoreColor(score?: number): string {
  if (score === undefined) return colors.text.secondary;
  if (score >= 80) return colors.primary.agriGreen;
  if (score >= 60) return colors.functional.warningYellow;
  return colors.text.secondary;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa xác định';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const ProposalComparisonTable: React.FC<ProposalComparisonTableProps> = ({
  proposals,
  onAccept,
  onReject,
}) => {
  if (proposals.length === 0) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📭</div>
        <Text style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
          Chưa có đề xuất nào từ thương lái.
        </Text>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const bestPrice = pendingProposals.length > 0
    ? Math.min(...pendingProposals.map((p) => p.pricePerUnit))
    : null;
  const bestScore = pendingProposals.length > 0
    ? Math.max(...pendingProposals.map((p) => p.traderTrustScore ?? 0))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {proposals.map((proposal) => {
        const isBestPrice = bestPrice !== null && proposal.pricePerUnit === bestPrice && proposal.status === 'pending';
        const isBestScore = bestScore !== null && (proposal.traderTrustScore ?? 0) === bestScore && proposal.status === 'pending';
        const scoreColor = trustScoreColor(proposal.traderTrustScore);

        const cardStyles: React.CSSProperties = {
          backgroundColor: colors.background.primary,
          borderRadius: '12px',
          border: isBestPrice
            ? `2px solid ${colors.primary.agriGreen}`
            : `1px solid ${colors.background.tertiary}`,
          overflow: 'hidden',
          boxShadow: isBestPrice
            ? `0 4px 12px rgba(62,187,108,0.15)`
            : '0 2px 8px rgba(0,0,0,0.06)',
        };

        return (
          <div key={proposal.id} style={cardStyles}>
            {isBestPrice && (
              <div style={{
                backgroundColor: colors.primary.agriGreen,
                padding: `${spacing.xs} ${spacing.md}`,
                fontSize: '11px',
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
              }}>
                Giá tốt nhất
              </div>
            )}

            {/* Trader row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
            }}>
              {/* Avatar */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: colors.background.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: fontWeight.bold,
                color: colors.text.secondary,
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {proposal.traderAvatar
                  ? <img src={proposal.traderAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(proposal.traderName)
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {proposal.traderName}
                </Text>

                {proposal.traderTrustScore !== undefined && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    marginTop: '2px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: `${scoreColor}22`,
                    border: `1px solid ${scoreColor}`,
                  }}>
                    <span style={{ fontSize: '10px', color: scoreColor, fontWeight: fontWeight.semibold }}>
                      ★ Điểm tin: {proposal.traderTrustScore}
                    </span>
                    {isBestScore && (
                      <span style={{ fontSize: '10px', color: colors.primary.zaloBlue }}>· Tốt nhất</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Price + details */}
            <div style={{
              padding: `0 ${spacing.md} ${spacing.md}`,
              borderBottom: `1px solid ${colors.background.secondary}`,
            }}>
              <div style={{
                fontSize: fontSize.h2,
                fontWeight: fontWeight.bold,
                color: isBestPrice ? colors.primary.agriGreen : colors.primary.zaloBlue,
                marginBottom: spacing.xs,
              }}>
                {proposal.pricePerUnit.toLocaleString('vi-VN')} VNĐ/kg
              </div>

              <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                <div>
                  <Text style={{ fontSize: '11px', color: colors.text.secondary, margin: 0 }}>Số lượng</Text>
                  <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, margin: 0 }}>
                    {proposal.quantity.toLocaleString('vi-VN')} kg
                  </Text>
                </div>
                {proposal.farmName && (
                  <div>
                    <Text style={{ fontSize: '11px', color: colors.text.secondary, margin: 0 }}>Vườn</Text>
                    <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, margin: 0 }}>
                      {proposal.farmName}
                    </Text>
                  </div>
                )}
                <div>
                  <Text style={{ fontSize: '11px', color: colors.text.secondary, margin: 0 }}>Giao hàng</Text>
                  <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, margin: 0 }}>
                    {formatDate(proposal.deliveryDate)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Actions */}
            {proposal.status === 'pending' && (
              <div style={{
                display: 'flex',
                gap: spacing.sm,
                padding: spacing.md,
              }}>
                <button
                  type="button"
                  onClick={() => onAccept(proposal.id)}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: colors.primary.agriGreen,
                    color: colors.text.inverse,
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  onClick={() => onReject(proposal.id)}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: `2px solid ${colors.functional.alertRed}`,
                    backgroundColor: 'transparent',
                    color: colors.functional.alertRed,
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  Từ chối
                </button>
              </div>
            )}

            {proposal.status !== 'pending' && (
              <div style={{ padding: spacing.md }}>
                <div style={{
                  padding: `${spacing.xs} ${spacing.md}`,
                  borderRadius: '6px',
                  backgroundColor: proposal.status === 'accepted'
                    ? 'rgba(62,187,108,0.1)'
                    : colors.background.secondary,
                  color: proposal.status === 'accepted'
                    ? colors.primary.agriGreen
                    : colors.text.secondary,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.medium,
                  textAlign: 'center',
                }}>
                  {proposal.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
