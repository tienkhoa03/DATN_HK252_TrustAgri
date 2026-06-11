/**
 * QuickUpdateSheet — bottom sheet for logging a care step (FR-F09, NFR-R02)
 */

import React, { useState, useRef } from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useKeyboardInset, scrollIntoViewOnFocus } from '@/hooks/useKeyboardInset';
import {
  createCareLogWithEvidence,
  MAX_EVIDENCE_PHOTOS,
  pickEvidenceImages,
} from '@/services/evidenceUploadService';
import {
  enqueue as queueOfflineCareLog,
  countQueue,
  generateClientRecordId,
} from '@/services/careLogOfflineQueue';
import { notifyCareLogQueued } from '@/services/careLogAutoSync';
import { ApiError } from '@/api/errors';

export interface QuickUpdateSheetProps {
  open: boolean;
  onClose: () => void;
  farmId: string;
  standardStepId?: string;
  stepTitle?: string;
  onSuccess?: () => void;
}

function evidenceSnackbarExtra(uploaded: number, failed: number): string {
  if (uploaded === 0 && failed === 0) return '';
  if (failed === 0) return ` Đã lưu ${uploaded} ảnh minh chứng.`;
  if (uploaded === 0) return ' Nhật ký đã lưu nhưng ảnh minh chứng chưa tải được.';
  return ` Đã lưu ${uploaded}/${uploaded + failed} ảnh minh chứng.`;
}

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
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openSnackbar = useStableOpenSnackbar();
  const keyboardInset = useKeyboardInset();

  const resetForm = () => {
    setNote('');
    setPhotos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    setSubmitting(true);
    const clientRecordId = generateClientRecordId();
    try {
      const { evidenceUploaded, evidenceFailed } = await createCareLogWithEvidence(
        farmId,
        {
          action: 'inspection',
          notes: note.trim() || undefined,
          performedAt: new Date().toISOString(),
          standardStepId: standardStepId || undefined,
          clientRecordId,
        },
        photos,
      );
      const extra = evidenceSnackbarExtra(evidenceUploaded, evidenceFailed);
      const hasEvidenceIssue = evidenceFailed > 0 && evidenceUploaded === 0 && photos.length > 0;
      openSnackbar({
        type: hasEvidenceIssue ? 'error' : 'success',
        text: `Cập nhật bước quy trình thành công!${extra}`,
        duration: hasEvidenceIssue ? 4000 : 2500,
        icon: true,
      });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      // NFR-R02: nếu lỗi mạng → enqueue offline, thông báo người dùng
      const isNetworkError =
        !navigator.onLine ||
        (err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.httpStatus === 0));
      if (isNetworkError) {
        try {
          await queueOfflineCareLog({
            clientRecordId,
            farmId,
            action: 'inspection',
            notes: note.trim() || undefined,
            performedAt: new Date().toISOString(),
            standardStepId: standardStepId || undefined,
            evidenceUrls: [],
            queuedAt: new Date().toISOString(),
          });
          const count = await countQueue();
          notifyCareLogQueued(count);
          openSnackbar({
            type: 'warning',
            text: `Đã lưu ngoại tuyến — sẽ tự đồng bộ khi có mạng (${count} chờ)`,
            duration: 4000,
            icon: true,
          });
          resetForm();
          onSuccess?.();
          onClose();
        } catch {
          openSnackbar({ type: 'error', text: 'Không thể lưu nhật ký. Vui lòng thử lại.', duration: 3500, icon: true });
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Không thể ghi nhật ký. Vui lòng thử lại.';
        openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        // Khi bàn phím mở (iOS): nâng đáy sheet lên trên bàn phím; nếu không, đặt trên bottom nav.
        bottom: keyboardInset > 0 ? keyboardInset : 'calc(64px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        transition: 'bottom 0.15s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: colors.background.primary,
        borderRadius: '16px 16px 0 0',
        padding: `${spacing.md} ${spacing.md} ${spacing.xl}`,
        // Giới hạn chiều cao để luôn nằm gọn phía trên bàn phím, phần dư sẽ cuộn.
        maxHeight: keyboardInset > 0 ? `calc(100vh - ${keyboardInset + 24}px)` : '75vh',
        overflowY: 'auto',
      }}>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div style={{ marginBottom: spacing.md }}>
          <label style={{ display: 'block', fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs }}>
            Ghi chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={scrollIntoViewOnFocus}
            enterKeyHint="done"
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

        <button
          type="button"
          onClick={() => void handleSubmit()}
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
