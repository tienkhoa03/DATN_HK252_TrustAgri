/**
 * ContractContextBanner — scope badge for contract-level vs farm-overview traceability
 * (FR-G01 / US-G01 — contract scope context)
 */
import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import type { TraceabilityContractContextDto } from '@/services/traceabilityService';

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hiệu lực',
  pending_change: 'Đang điều chỉnh',
  in_settlement: 'Đang thanh lý',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã huỷ',
  pending_signature: 'Chờ ký',
};

function formatViDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface Props {
  scope: 'contract' | 'farm-overview';
  contract?: TraceabilityContractContextDto;
}

export const ContractContextBanner: React.FC<Props> = ({ scope, contract }) => {
  if (scope === 'farm-overview') {
    return (
      <div
        style={{
          margin: `0 ${spacing.md} ${spacing.md}`,
          padding: spacing.md,
          backgroundColor: `${colors.functional.warningYellow}18`,
          border: `1px solid ${colors.functional.warningYellow}66`,
          borderRadius: '8px',
        }}
      >
        <Text
          size="small"
          style={{
            color: colors.functional.warningYellow,
            fontWeight: fontWeight.semibold,
            display: 'block',
            marginBottom: spacing.xs,
            fontSize: fontSize.caption,
          }}
        >
          Tổng quan toàn vườn
        </Text>
        <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
          Vườn này chưa có hợp đồng đang hiệu lực — đang hiển thị tổng quan toàn vườn (dữ liệu có thể đến từ nhiều mùa vụ trước đó).
        </Text>
      </div>
    );
  }

  if (!contract) return null;

  if (contract.status === 'cancelled') {
    return (
      <div
        style={{
          margin: `0 ${spacing.md} ${spacing.md}`,
          padding: spacing.md,
          backgroundColor: `${colors.functional.alertRed}18`,
          border: `1px solid ${colors.functional.alertRed}66`,
          borderRadius: '8px',
        }}
      >
        <Text
          size="small"
          style={{
            color: colors.functional.alertRed,
            fontWeight: fontWeight.semibold,
            display: 'block',
            marginBottom: spacing.xs,
            fontSize: fontSize.caption,
          }}
        >
          Hợp đồng đã huỷ
        </Text>
        <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
          Dữ liệu chỉ mang tính lịch sử — không còn hiệu lực thương mại.
        </Text>
      </div>
    );
  }

  const statusBgColor =
    contract.status === 'active' || contract.status === 'pending_change'
      ? colors.primary.agriGreen
      : colors.primary.zaloBlue;

  return (
    <div
      style={{
        margin: `0 ${spacing.md} ${spacing.md}`,
        padding: spacing.md,
        backgroundColor: `${statusBgColor}12`,
        border: `1px solid ${statusBgColor}40`,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        }}
      >
        <Text
          size="small"
          style={{ fontWeight: fontWeight.semibold, color: colors.text.primary, fontSize: fontSize.caption }}
        >
          {`Lô hàng ${contract.traceabilityCode}`}
        </Text>
        <span
          style={{
            padding: `2px ${spacing.sm}`,
            backgroundColor: `${statusBgColor}20`,
            color: statusBgColor,
            borderRadius: '12px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
          }}
        >
          {STATUS_LABEL[contract.status] ?? contract.status}
        </span>
      </div>
      <Text size="xSmall" style={{ color: colors.text.secondary, display: 'block', fontSize: fontSize.caption }}>
        {`Mùa vụ ${formatViDate(contract.startDate)} – ${formatViDate(contract.endDate)}`}
        {contract.productName ? ` · ${contract.productName}` : ''}
        {contract.quantity && contract.unit ? ` ${contract.quantity} ${contract.unit}` : ''}
      </Text>
    </div>
  );
};
