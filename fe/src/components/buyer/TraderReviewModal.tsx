import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { primaryColors, backgroundColors, textColors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { createTraderReview, toReviewViMessage } from '@/services/traderReviewService';

export interface TraderReviewModalProps {
  traderId: string;
  orderId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STAR_GOLD = '#FACC15';
const STAR_GRAY = '#E5E7EB';

export function TraderReviewModal({
  traderId,
  orderId,
  open,
  onClose,
  onSuccess,
}: TraderReviewModalProps) {
  const openSnackbar = useStableOpenSnackbar();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createTraderReview(traderId, { orderId, rating, comment: comment.trim() || undefined });
      onSuccess();
      onClose();
    } catch (err) {
      openSnackbar({ text: toReviewViMessage(err), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const displayStar = hovered > 0 ? hovered : rating;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: backgroundColors.primary,
          borderRadius: 16,
          padding: spacing.md,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Text
          style={{
            fontSize: fontSize.h2,
            fontWeight: fontWeight.bold,
            color: textColors.primary,
            display: 'block',
            marginBottom: spacing.md,
          }}
        >
          Đánh giá thương lái
        </Text>

        {/* Star rating */}
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s} sao`}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: s <= displayStar ? STAR_GOLD : STAR_GRAY,
                transition: 'color 0.1s',
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Nhận xét của bạn (tùy chọn)"
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1.5px solid ${backgroundColors.tertiary}`,
            borderRadius: 8,
            fontSize: fontSize.caption,
            color: textColors.primary,
            background: backgroundColors.primary,
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'none',
            marginBottom: spacing.md,
            fontFamily: 'inherit',
          }}
        />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
              background: backgroundColors.secondary,
              border: 'none',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              color: textColors.secondary,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
              background: primaryColors.zaloBlue,
              border: 'none',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              color: '#fff',
              cursor: rating === 0 || submitting ? 'not-allowed' : 'pointer',
              opacity: rating === 0 || submitting ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Đang gửi…' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TraderReviewModal;
