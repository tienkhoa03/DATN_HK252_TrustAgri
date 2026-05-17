/**
 * StandardInfoModal — hiển thị chi tiết một tiêu chuẩn sản xuất.
 * Dùng chung cho farmer / trader khi click vào tên tiêu chuẩn trong contract.
 */
import React, { useEffect, useState } from 'react';
import { Text } from 'zmp-ui';
import { getStandard, type StandardDto } from '@/services/standardService';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

interface Props {
  standardId: string;
  standardName?: string | null;
  onClose: () => void;
}

export const StandardInfoModal: React.FC<Props> = ({ standardId, standardName, onClose }) => {
  const [standard, setStandard] = useState<StandardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStandard(standardId)
      .then(setStandard)
      .catch(() => setStandard(null))
      .finally(() => setLoading(false));
  }, [standardId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          backgroundColor: colors.background.primary,
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: `${spacing.sm} 0 0` }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.background.secondary }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.md,
            borderBottom: `1px solid ${colors.background.secondary}`,
          }}
        >
          <Text.Title size="small" style={{ margin: 0 }}>
            {loading ? (standardName ?? 'Tiêu chuẩn') : (standard?.name ?? standardName ?? 'Tiêu chuẩn')}
          </Text.Title>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: colors.text.secondary,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: spacing.md, flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
              <Text size="small">Đang tải...</Text>
            </div>
          )}

          {!loading && !standard && (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
              <Text size="small">Không tải được thông tin tiêu chuẩn.</Text>
            </div>
          )}

          {!loading && standard && (
            <>
              {/* Meta */}
              <div
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 10,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                <InfoRow label="Mã tiêu chuẩn" value={standard.code} />
                {standard.cropType && <InfoRow label="Loại cây trồng" value={standard.cropType} />}
                <InfoRow label="Phiên bản" value={`v${standard.version}`} />
                {standard.ownerTraderName && (
                  <InfoRow label="Đơn vị ban hành" value={standard.ownerTraderName} />
                )}
              </div>

              {/* Description */}
              {standard.description && (
                <div style={{ marginBottom: spacing.md }}>
                  <Text
                    size="xSmall"
                    style={{ fontWeight: fontWeight.semibold, color: colors.text.secondary, marginBottom: spacing.xs, display: 'block' }}
                  >
                    Mô tả
                  </Text>
                  <Text size="small" style={{ lineHeight: '1.6', color: colors.text.primary }}>
                    {standard.description}
                  </Text>
                </div>
              )}

              {/* Steps */}
              {standard.steps.length > 0 && (
                <div>
                  <Text
                    size="xSmall"
                    style={{ fontWeight: fontWeight.semibold, color: colors.text.secondary, marginBottom: spacing.sm, display: 'block' }}
                  >
                    Các bước sản xuất ({standard.steps.length})
                  </Text>
                  {standard.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        gap: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          minWidth: 24,
                          borderRadius: '50%',
                          backgroundColor: colors.primary.agriGreen,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: fontSize.caption,
                          fontWeight: fontWeight.semibold,
                          marginTop: 2,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text
                          size="small"
                          style={{ fontWeight: fontWeight.semibold, display: 'block', marginBottom: 2 }}
                        >
                          {step.title}
                        </Text>
                        <Text size="xSmall" style={{ color: colors.text.secondary, lineHeight: '1.5' }}>
                          {step.description}
                        </Text>
                        {step.expectedDurationDays != null && (
                          <Text size="xSmall" style={{ color: colors.primary.agriGreen, marginTop: 2 }}>
                            Thời gian dự kiến: {step.expectedDurationDays} ngày
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
    <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
      {label}
    </Text>
    <Text size="xSmall" style={{ fontWeight: fontWeight.semibold, fontSize: fontSize.caption }}>
      {value}
    </Text>
  </div>
);
