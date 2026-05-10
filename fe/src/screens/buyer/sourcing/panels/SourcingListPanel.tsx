/**
 * SourcingListPanel — list of buyer's buying requests
 *
 * Requirements: FR-U02, FR-U03, NFR-U01, NFR-U03
 */

import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listBuyingRequests,
  toBuyingRequestViMessage,
  type BuyingRequestDto,
} from '@/services/buyingRequestService';

export interface BuyingRequest extends BuyingRequestDto {
  proposalCount?: number;
}

export interface SourcingListPanelProps {
  onSelectRequest: (id: string) => void;
  onCreateRequest: () => void;
}

type StatusKey = BuyingRequestDto['status'];

const STATUS_LABEL: Record<StatusKey, string> = {
  open: 'Đang mở',
  matched: 'Đã khớp',
  closed: 'Đã đóng',
};

const STATUS_COLOR: Record<StatusKey, { bg: string; color: string }> = {
  open: { bg: 'rgba(62,187,108,0.12)', color: colors.primary.agriGreen },
  matched: { bg: 'rgba(0,104,255,0.12)', color: colors.primary.zaloBlue },
  closed: { bg: colors.background.secondary, color: colors.text.secondary },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const SourcingListPanel: React.FC<SourcingListPanelProps> = ({
  onSelectRequest,
  onCreateRequest,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [requests, setRequests] = useState<BuyingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBuyingRequests({ buyerId: 'me' })
      .then((res) => {
        if (!cancelled) {
          setRequests(res.items);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = toBuyingRequestViMessage(err, 'list');
          setError(msg);
          setLoading(false);
          openSnackbar({ type: 'error', text: msg, duration: 4000 });
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '80px',
    right: spacing.lg,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    zIndex: 200,
    transition: 'transform 0.2s',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    border: `1px solid ${colors.background.tertiary}`,
    padding: spacing.md,
    cursor: 'pointer',
    marginBottom: spacing.sm,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.2s',
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.md }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            ...cardStyles,
            cursor: 'default',
            height: '80px',
            backgroundColor: colors.background.secondary,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: spacing.md }}>⚠️</div>
        <Text style={{ color: colors.functional.alertRed, fontSize: fontSize.caption }}>
          {error}
        </Text>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <div style={{ padding: spacing.xl, textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: spacing.md }}>🛒</div>
          <Text style={{
            color: colors.text.secondary,
            fontSize: fontSize.caption,
            lineHeight: 1.6,
          }}>
            Chưa có nhu cầu mua nào.{'\n'}Nhấn + để tạo mới.
          </Text>
        </div>
        <button
          type="button"
          style={fabStyles}
          onClick={onCreateRequest}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          aria-label="Tạo nhu cầu mua"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', padding: spacing.md, paddingBottom: '100px' }}>
      {requests.map((req) => {
        const sc = STATUS_COLOR[req.status] ?? STATUS_COLOR.closed;
        return (
          <div
            key={req.id}
            style={cardStyles}
            onClick={() => onSelectRequest(req.id)}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, margin: 0 }}>
                  {req.cropType}
                </Text>
                <Text style={{ fontSize: fontSize.caption, color: colors.text.secondary, margin: 0 }}>
                  {req.quantity.toLocaleString('vi-VN')} {req.unit} • {formatDate(req.createdAt)}
                </Text>
              </div>

              <div style={{
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: sc.bg,
                flexShrink: 0,
                marginLeft: spacing.sm,
              }}>
                <span style={{ fontSize: '12px', fontWeight: fontWeight.semibold, color: sc.color }}>
                  {STATUS_LABEL[req.status]}
                </span>
              </div>
            </div>

            {(req.proposalCount ?? 0) > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,104,255,0.1)',
              }}>
                <span style={{ fontSize: '12px', color: colors.primary.zaloBlue, fontWeight: fontWeight.medium }}>
                  {req.proposalCount} đề xuất mới
                </span>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        style={fabStyles}
        onClick={onCreateRequest}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label="Tạo nhu cầu mua"
      >
        +
      </button>
    </div>
  );
};
