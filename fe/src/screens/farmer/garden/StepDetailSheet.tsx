/**
 * StepDetailSheet — bottom sheet hiển thị nhật ký + form thêm ghi chú/minh chứng (FR-F09)
 */

import React, { useState, useEffect, useRef } from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { listCareLogs, type CareLogDto } from '@/services/careLogService';
import {
  createCareLogWithEvidence,
  MAX_EVIDENCE_PHOTOS,
  pickEvidenceImages,
} from '@/services/evidenceUploadService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

export interface StepDetailSheetProps {
  open: boolean;
  onClose: () => void;
  farmId: string;
  standardStepId?: string;
  stepTitle?: string;
  onSuccess?: () => void;
  /** Chế độ chỉ xem — ẩn form thêm ghi chú/minh chứng (vd: buyer theo dõi vườn) */
  readOnly?: boolean;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function evidenceExtra(uploaded: number, failed: number): string {
  if (uploaded === 0 && failed === 0) return '';
  if (failed === 0) return ` Đã lưu ${uploaded} ảnh.`;
  if (uploaded === 0) return ' Ghi chú đã lưu nhưng ảnh chưa tải được.';
  return ` Đã lưu ${uploaded}/${uploaded + failed} ảnh.`;
}

export const StepDetailSheet: React.FC<StepDetailSheetProps> = ({
  open, onClose, farmId, standardStepId, stepTitle, onSuccess, readOnly = false,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [careLogs, setCareLogs] = useState<CareLogDto[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLogs = async () => {
    if (!farmId) return;
    setLogsLoading(true);
    try {
      const res = await listCareLogs(farmId, { standardStepId, limit: 50 });
      setCareLogs(res.items);
    } catch {
      openSnackbar({ type: 'error', text: 'Không thể tải nhật ký chăm sóc.', duration: 3000, icon: true });
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadLogs();
    else {
      setNote('');
      setPhotos([]);
      setCareLogs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, farmId, standardStepId]);

  // Object URLs cho preview ảnh đã chọn
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoUrls(urls);
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [photos]);

  const handlePickPhotos = async () => {
    try {
      const picked = await pickEvidenceImages(MAX_EVIDENCE_PHOTOS);
      if (picked.length > 0) { setPhotos(picked); return; }
    } catch { /* fallback to file input */ }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotos(Array.from(e.target.files ?? []).slice(0, MAX_EVIDENCE_PHOTOS));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!note.trim() && photos.length === 0) return;
    setSubmitting(true);
    try {
      const { evidenceUploaded, evidenceFailed } = await createCareLogWithEvidence(
        farmId,
        {
          action: 'inspection',
          notes: note.trim() || undefined,
          performedAt: new Date().toISOString(),
          standardStepId: standardStepId || undefined,
          clientRecordId: `sd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
        photos,
      );
      const extra = evidenceExtra(evidenceUploaded, evidenceFailed);
      openSnackbar({ type: 'success', text: `Đã thêm ghi chú!${extra}`, duration: 2500, icon: true });
      setNote('');
      setPhotos([]);
      await loadLogs();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể thêm ghi chú.';
      openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const canSubmit = (note.trim().length > 0 || photos.length > 0) && !submitting;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1100,
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
            Chi tiết bước quy trình
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
            display: 'inline-flex', alignItems: 'center',
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

        {/* Nhật ký đã ghi */}
        <div style={{ marginBottom: spacing.md }}>
          <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.text.secondary }}>
            Nhật ký đã ghi
          </span>

          {logsLoading && (
            <div
              className="skeleton-pulse"
              style={{ height: 60, backgroundColor: colors.background.secondary, borderRadius: 8, marginTop: spacing.xs }}
              aria-hidden="true"
            />
          )}

          {!logsLoading && careLogs.length === 0 && (
            <p style={{ fontSize: fontSize.small, color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
              Chưa có nhật ký nào cho bước này.
            </p>
          )}

          {!logsLoading && careLogs.map((log) => (
            <div key={log.id} style={{
              marginTop: spacing.sm,
              padding: spacing.sm,
              backgroundColor: colors.background.secondary,
              borderRadius: 8,
              border: `1px solid ${colors.background.tertiary}`,
            }}>
              <div style={{ fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: log.notes || log.evidences.length > 0 ? spacing.xs : 0 }}>
                {formatDateTime(log.performedAt)}
                {log.performedByName ? ` · ${log.performedByName}` : ''}
              </div>
              {log.notes && (
                <div style={{ fontSize: fontSize.small, color: colors.text.primary, marginBottom: log.evidences.length > 0 ? spacing.xs : 0 }}>
                  {log.notes}
                </div>
              )}
              {log.evidences.length > 0 && (
                <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                  {log.evidences.slice(0, 5).map((ev) => (
                    <img
                      key={ev.id}
                      src={ev.fileUrl}
                      alt="Minh chứng"
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${colors.background.tertiary}` }}
                    />
                  ))}
                  {log.evidences.length > 5 && (
                    <div style={{
                      width: 64, height: 64, borderRadius: 6,
                      backgroundColor: colors.background.tertiary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: fontSize.small, color: colors.text.secondary,
                    }}>
                      +{log.evidences.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form thêm ghi chú/minh chứng — ẩn ở chế độ chỉ xem */}
        {!readOnly && (
        <>
        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.background.secondary, margin: `0 0 ${spacing.md}` }} />

        <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.text.secondary }}>
          Thêm ghi chú & minh chứng
        </span>

        {/* Photo picker */}
        <div style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
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
            📷 {photos.length > 0 ? `Đã chọn ${photos.length} ảnh` : 'Chọn ảnh'}
          </button>

          {photoUrls.length > 0 && (
            <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.xs }}>
              {photoUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={url}
                    alt={`Ảnh ${i + 1}`}
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${colors.background.tertiary}` }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: colors.functional.alertRed,
                      color: colors.text.inverse, border: 'none',
                      cursor: 'pointer', fontSize: '10px', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file" accept="image/*" multiple
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
            rows={3}
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
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: spacing.md,
            backgroundColor: canSubmit ? colors.primary.agriGreen : colors.text.disabled,
            color: colors.text.inverse,
            border: 'none', borderRadius: 8, fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            minHeight: 44,
          }}
        >
          {submitting ? 'Đang lưu…' : 'Lưu ghi chú'}
        </button>
        </>
        )}
      </div>
    </div>
  );
};

export default StepDetailSheet;
