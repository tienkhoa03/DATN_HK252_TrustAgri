/**
 * ContractDiffView — Phase 3 (FR-U04)
 * 2-column diff view for contract renegotiation.
 * Highlights changed fields (red border left / green border right).
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

export interface ContractTermsSnapshot {
  deliveryDate?: string;
  quantity?: number;
  pricePerUnit?: number;
  qualityStandardCode?: string;
  depositAmount?: number;
  notes?: string;
}

export interface ContractDiffViewProps {
  before: ContractTermsSnapshot;
  after: ContractTermsSnapshot;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

type FieldKey = keyof ContractTermsSnapshot;

const FIELD_LABELS: Record<FieldKey, string> = {
  deliveryDate: 'Ngày giao hàng',
  quantity: 'Số lượng',
  pricePerUnit: 'Giá/kg',
  qualityStandardCode: 'Tiêu chuẩn',
  depositAmount: 'Tiền cọc',
  notes: 'Ghi chú',
};

const FIELDS: FieldKey[] = ['deliveryDate', 'quantity', 'pricePerUnit', 'qualityStandardCode', 'depositAmount', 'notes'];

function formatFieldValue(key: FieldKey, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'pricePerUnit' || key === 'depositAmount') {
    return typeof value === 'number'
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
      : String(value);
  }
  if (key === 'quantity') {
    return `${value} kg`;
  }
  return String(value);
}

export const ContractDiffView: React.FC<ContractDiffViewProps> = ({
  before,
  after,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xs }}>
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: colors.background.tertiary,
            borderRadius: '8px 8px 0 0',
            textAlign: 'center',
          }}
        >
          <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0, color: colors.text.secondary }}>
            Hiện tại
          </Text>
        </div>
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: `${colors.primary.agriGreen}18`,
            borderRadius: '8px 8px 0 0',
            textAlign: 'center',
          }}
        >
          <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0, color: colors.primary.agriGreen }}>
            Đề xuất mới
          </Text>
        </div>
      </div>

      {/* Diff rows */}
      {FIELDS.map((key) => {
        const beforeVal = before[key];
        const afterVal = after[key];
        const changed = String(beforeVal ?? '') !== String(afterVal ?? '');

        return (
          <div key={key}>
            <Text
              size="xSmall"
              style={{ color: colors.text.secondary, margin: `0 0 ${spacing.xs} 0`, display: 'block' }}
            >
              {FIELD_LABELS[key]}
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xs }}>
              <div
                style={{
                  padding: spacing.sm,
                  backgroundColor: changed ? `${colors.functional.alertRed}08` : colors.background.secondary,
                  borderRadius: '8px',
                  border: changed ? `1px solid ${colors.functional.alertRed}50` : `1px solid ${colors.background.tertiary}`,
                }}
              >
                <Text
                  size="small"
                  style={{
                    margin: 0,
                    color: changed ? colors.functional.alertRed : colors.text.secondary,
                    fontWeight: changed ? fontWeight.medium : fontWeight.regular,
                  }}
                >
                  {formatFieldValue(key, beforeVal)}
                </Text>
              </div>
              <div
                style={{
                  padding: spacing.sm,
                  backgroundColor: changed ? `${colors.primary.agriGreen}08` : colors.background.secondary,
                  borderRadius: '8px',
                  border: changed ? `1px solid ${colors.primary.agriGreen}50` : `1px solid ${colors.background.tertiary}`,
                }}
              >
                <Text
                  size="small"
                  style={{
                    margin: 0,
                    color: changed ? colors.primary.agriGreen : colors.text.secondary,
                    fontWeight: changed ? fontWeight.semibold : fontWeight.regular,
                  }}
                >
                  {formatFieldValue(key, afterVal)}
                </Text>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
        <button
          onClick={onApprove}
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: '44px',
            padding: spacing.sm,
            backgroundColor: colors.primary.agriGreen,
            color: colors.text.inverse,
            border: 'none',
            borderRadius: '8px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? '...' : 'Đồng ý thay đổi'}
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: '44px',
            padding: spacing.sm,
            backgroundColor: 'transparent',
            color: colors.functional.alertRed,
            border: `1px solid ${colors.functional.alertRed}`,
            borderRadius: '8px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          Từ chối
        </button>
      </div>
    </div>
  );
};
