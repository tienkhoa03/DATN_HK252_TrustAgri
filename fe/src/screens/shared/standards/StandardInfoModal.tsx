/**
 * StandardInfoModal — hiển thị chi tiết một tiêu chuẩn sản xuất (full màn hình).
 * Dùng chung cho farmer / trader / buyer khi click vào tên tiêu chuẩn trong contract.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const title = loading
    ? (standardName ?? 'Tiêu chuẩn')
    : (standard?.name ?? standardName ?? 'Tiêu chuẩn');

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        backgroundColor: colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.secondary}`,
          flexShrink: 0,
          backgroundColor: colors.background.primary,
        }}
      >
        <Text.Title size="small" style={{ margin: 0, flex: 1, paddingRight: spacing.sm }}>
          {title}
        </Text.Title>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
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
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
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
            <div
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 10,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <InfoRow label="Mã tiêu chuẩn" value={standard.code} />
              {standard.ownerTraderId && (
                <InfoRow label="Đơn vị ban hành" value={standard.ownerTraderId} />
              )}
              {standard.createdAt && (
                <InfoRow
                  label="Ngày ban hành"
                  value={new Date(standard.createdAt).toLocaleDateString('vi-VN')}
                />
              )}
            </div>

            {standard.description && (
              <div style={{ marginBottom: spacing.md }}>
                <Text
                  size="xSmall"
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                    display: 'block',
                  }}
                >
                  Mô tả
                </Text>
                <Text size="small" style={{ lineHeight: '1.6', color: colors.text.primary }}>
                  {standard.description}
                </Text>
              </div>
            )}

            {standard.steps.length > 0 && (
              <div>
                <Text
                  size="xSmall"
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.text.secondary,
                    marginBottom: spacing.sm,
                    display: 'block',
                  }}
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
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
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
