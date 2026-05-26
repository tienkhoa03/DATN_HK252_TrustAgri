import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import type { TraceabilityComplianceCertificateDto } from '@/services/traceabilityService';

interface Props {
  certificate: TraceabilityComplianceCertificateDto;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export const ComplianceCertificateCard: React.FC<Props> = ({ certificate }) => {
  if (certificate.status === 'none') return null;

  const isVerified = certificate.status === 'verified';
  const bgColor = isVerified ? '#D1FAE5' : '#FEF3C7';
  const borderColor = isVerified ? colors.primary.agriGreen : '#F59E0B';
  const textColor = isVerified ? '#065F46' : '#92400E';
  const scorePercent = certificate.complianceScore != null
    ? Math.round(certificate.complianceScore * 100)
    : null;

  return (
    <div
      style={{
        margin: `0 ${spacing.md} ${spacing.md}`,
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: spacing.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <span style={{ fontSize: '22px' }}>{isVerified ? '🏅' : '⏳'}</span>
        <div style={{ fontSize: fontSize.h2, fontWeight: fontWeight.bold, color: textColor }}>
          {isVerified ? 'Chứng nhận tuân thủ hợp đồng' : 'Đang tính toán chứng nhận'}
        </div>
      </div>

      {isVerified ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {scorePercent != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: textColor }}>Điểm tuân thủ</Text>
              <Text size="small" style={{ fontWeight: fontWeight.bold, color: textColor }}>{scorePercent}%</Text>
            </div>
          )}
          {certificate.completedSteps != null && certificate.totalSteps != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: textColor }}>Bước hoàn thành</Text>
              <Text size="small" style={{ fontWeight: fontWeight.semibold, color: textColor }}>
                {certificate.completedSteps}/{certificate.totalSteps}
              </Text>
            </div>
          )}
          {certificate.standardCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: textColor }}>Tiêu chuẩn</Text>
              <Text size="small" style={{ fontWeight: fontWeight.medium, color: textColor }}>{certificate.standardCode}</Text>
            </div>
          )}
          {certificate.lastComputedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: textColor }}>Xác thực lần cuối</Text>
              <Text size="small" style={{ color: textColor }}>{formatDate(certificate.lastComputedAt)}</Text>
            </div>
          )}
        </div>
      ) : (
        <Text size="small" style={{ color: textColor }}>
          Dữ liệu tuân thủ đang được tính toán, vui lòng quay lại sau.
        </Text>
      )}
    </div>
  );
};

export default ComplianceCertificateCard;
