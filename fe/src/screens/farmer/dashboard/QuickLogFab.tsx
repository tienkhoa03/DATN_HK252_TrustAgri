/**
 * QuickLogFab — floating action button to create a care log quickly (FR-F09, NFR-U01)
 */

import React, { useState, useRef } from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  createCareLogWithEvidence,
  MAX_EVIDENCE_PHOTOS,
  pickEvidenceImages,
} from '@/services/evidenceUploadService';

const ACTION_OPTIONS = [
  { value: 'watering', label: 'Tưới nước' },
  { value: 'fertilizing', label: 'Bón phân' },
  { value: 'pest_control', label: 'Phun thuốc' },
  { value: 'inspection', label: 'Kiểm tra vườn' },
  { value: 'harvesting', label: 'Thu hoạch' },
  { value: 'other', label: 'Khác' },
];

export interface QuickLogFabProps {
  farmId: string | null;
  onSuccess?: () => void;
}

function evidenceSnackbarExtra(uploaded: number, failed: number): string {
  if (uploaded === 0 && failed === 0) return '';
  if (failed === 0) return ` Đã lưu ${uploaded} ảnh minh chứng.`;
  if (uploaded === 0) return ' Nhật ký đã lưu nhưng ảnh minh chứng chưa tải được.';
  return ` Đã lưu ${uploaded}/${uploaded + failed} ảnh minh chứng.`;
}

export const QuickLogFab: React.FC<QuickLogFabProps> = ({ farmId, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [action, setAction] = useState('inspection');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openSnackbar = useStableOpenSnackbar();

  const resetForm = () => {
    setStep(1);
    setAction('inspection');
    setNote('');
    setPhotos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpen = () => {
    if (!farmId) {
      openSnackbar({ type: 'error', text: 'Chưa có vườn. Vui lòng tạo hồ sơ vườn trước.', duration: 3000, icon: true });
      return;
    }
    resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handlePickPhotos = async () => {
    try {
      const picked = await pickEvidenceImages(MAX_EVIDENCE_PHOTOS);
      if (picked.length > 0) {
        setPhotos(picked);
        return;
      }
    } catch {
      // fallback file input
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotos(Array.from(e.target.files ?? []).slice(0, MAX_EVIDENCE_PHOTOS));
  };

  const handleSubmit = async () => {
    if (!farmId) return;
    setSubmitting(true);
    try {
      const { evidenceUploaded, evidenceFailed } = await createCareLogWithEvidence(
        farmId,
        {
          action,
          notes: note.trim() || undefined,
          performedAt: new Date().toISOString(),
          clientRecordId: `qf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
        photos,
      );
      const extra = evidenceSnackbarExtra(evidenceUploaded, evidenceFailed);
      const hasEvidenceIssue = evidenceFailed > 0 && evidenceUploaded === 0 && photos.length > 0;
      openSnackbar({
        type: hasEvidenceIssue ? 'error' : 'success',
        text: `Đã ghi nhật ký thành công!${extra}`,
        duration: hasEvidenceIssue ? 4000 : 2500,
        icon: true,
      });
      handleClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể ghi nhật ký. Vui lòng thử lại.';
      openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Ghi nhật ký nhanh"
        style={{
          position: 'fixed',
          bottom: 88,
          right: 16,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.primary.agriGreen,
          color: colors.text.inverse,
          border: 'none',
          borderRadius: 24,
          fontSize: fontSize.caption,
          fontWeight: fontWeight.semibold,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(62,187,108,0.4)',
          minHeight: 44,
        }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
        Ghi nhật ký
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div style={{
            backgroundColor: colors.background.primary,
            borderRadius: '16px 16px 0 0',
            padding: `${spacing.md} ${spacing.md} ${spacing.xl}`,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <span style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                Ghi nhật ký nhanh
              </span>
              <button
                type="button" onClick={handleClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: colors.text.secondary, minHeight: 44, minWidth: 44 }}
              >
                ✕
              </button>
            </div>

            {step === 1 && (
              <>
                <div style={{ marginBottom: spacing.md }}>
                  <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
                    Loại công việc
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    style={{
                      width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`,
                      borderRadius: 8, fontSize: fontSize.caption, color: colors.text.primary,
                      backgroundColor: colors.background.primary, minHeight: 44,
                    }}
                  >
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: spacing.md }}>
                  <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
                    Ảnh minh chứng (tối đa {MAX_EVIDENCE_PHOTOS} ảnh)
                  </label>
                  <button
                    type="button"
                    onClick={() => void handlePickPhotos()}
                    style={{
                      width: '100%', padding: spacing.sm,
                      border: `1px dashed ${colors.background.secondary}`,
                      borderRadius: 8, fontSize: fontSize.caption,
                      color: photos.length > 0 ? colors.primary.agriGreen : colors.text.secondary,
                      backgroundColor: colors.background.secondary, cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    📷  {photos.length > 0 ? `Đã chọn ${photos.length} ảnh` : 'Chọn ảnh'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%', padding: spacing.md,
                    backgroundColor: colors.primary.zaloBlue, color: colors.text.inverse,
                    border: 'none', borderRadius: 8, fontSize: fontSize.caption,
                    fontWeight: fontWeight.semibold, cursor: 'pointer', minHeight: 44,
                  }}
                >
                  Tiếp theo
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: spacing.md }}>
                  <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Nhập ghi chú về công việc vừa thực hiện…"
                    style={{
                      width: '100%', padding: spacing.sm,
                      border: `1px solid ${colors.background.secondary}`,
                      borderRadius: 8, fontSize: fontSize.caption, color: colors.text.primary,
                      backgroundColor: colors.background.primary, resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: spacing.md,
                      backgroundColor: colors.background.secondary, color: colors.text.primary,
                      border: 'none', borderRadius: 8, fontSize: fontSize.caption,
                      fontWeight: fontWeight.medium, cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    style={{
                      flex: 2, padding: spacing.md,
                      backgroundColor: submitting ? colors.text.disabled : colors.primary.agriGreen,
                      color: colors.text.inverse,
                      border: 'none', borderRadius: 8, fontSize: fontSize.caption,
                      fontWeight: fontWeight.semibold, cursor: submitting ? 'not-allowed' : 'pointer',
                      minHeight: 44,
                    }}
                  >
                    {submitting ? 'Đang lưu…' : 'Ghi nhật ký'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickLogFab;
