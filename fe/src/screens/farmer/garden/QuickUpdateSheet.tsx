/**
 * QuickUpdateSheet — bottom sheet for logging a care step (FR-F09)
 */

import React, { useState, useRef } from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { createCareLog } from '@/services/careLogService';

export interface QuickUpdateSheetProps {
  open: boolean;
  onClose: () => void;
  farmId: string;
  standardStepId?: string;
  stepTitle?: string;
  onSuccess?: () => void;
}

const MAX_PHOTOS = 3;

export const QuickUpdateSheet: React.FC<QuickUpdateSheetProps> = ({
  open,
  onClose,
  farmId,
  standardStepId,
  stepTitle,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openSnackbar = useStableOpenSnackbar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setPhotoCount(Math.min(files.length, MAX_PHOTOS));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createCareLog(farmId, {
        action: 'inspection',
        notes: note.trim() || undefined,
        performedAt: new Date().toISOString(),
        standardStepId: standardStepId || undefined,
        clientRecordId: `qu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      });
      openSnackbar({ type: 'success', text: 'Cập nhật bước quy trình thành công!', duration: 2500, icon: true });
      setNote('');
      setPhotoCount(0);
      onSuccess?.();
      onClose();
    } catch {
      openSnackbar({ type: 'error', text: 'Không thể ghi nhật ký. Vui lòng thử lại.', duration: 3500, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: colors.background.primary,
        borderRadius: '16px 16px 0 0',
        padding: `${spacing.md} ${spacing.md} ${spacing.xl}`,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <span style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
            Cập nhật bước quy trình
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: colors.text.secondary, minHeight: 44, minWidth: 44 }}
          >
            ✕
          </button>
        </div>

        {/* Step chip */}
        {stepTitle && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: `${colors.primary.agriGreen}18`,
            border: `1px solid ${colors.primary.agriGreen}`,
            borderRadius: 20, marginBottom: spacing.md,
          }}>
            <span style={{ fontSize: fontSize.small, color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
              {stepTitle}
            </span>
          </div>
        )}

        {/* Photo upload */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
            Ảnh minh chứng (tối đa {MAX_PHOTOS} ảnh)
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', padding: spacing.sm,
              border: `1px dashed ${colors.background.secondary}`,
              borderRadius: 8, fontSize: fontSize.caption,
              color: photoCount > 0 ? colors.primary.agriGreen : colors.text.secondary,
              backgroundColor: colors.background.secondary, cursor: 'pointer', minHeight: 44,
            }}
          >
            📷  {photoCount > 0 ? `Đã chọn ${photoCount} ảnh` : 'Chọn ảnh'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Note textarea */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
            Ghi chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Nhập ghi chú về bước quy trình…"
            style={{
              width: '100%', padding: spacing.sm,
              border: `1px solid ${colors.background.secondary}`,
              borderRadius: 8, fontSize: fontSize.caption, color: colors.text.primary,
              backgroundColor: colors.background.primary, resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: spacing.md,
            backgroundColor: submitting ? colors.text.disabled : colors.primary.agriGreen,
            color: colors.text.inverse,
            border: 'none', borderRadius: 8, fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold, cursor: submitting ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {submitting ? 'Đang lưu…' : 'Xác nhận hoàn thành'}
        </button>
      </div>
    </div>
  );
};

export default QuickUpdateSheet;
