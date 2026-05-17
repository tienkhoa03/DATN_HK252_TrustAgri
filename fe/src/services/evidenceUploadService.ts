/**
 * evidenceUploadService — upload ảnh minh chứng cho care log (FR-F09).
 * MVP: nén ảnh → data URL → POST /farms/:farmId/evidence (metadata).
 */
import { compressImage } from '@/utils/imageOptimization';
import {
  createCareLog,
  uploadEvidence,
  type CareLogDto,
  type CreateCareLogDto,
} from '@/services/careLogService';

export const MAX_EVIDENCE_PHOTOS = 5;
const MAX_EVIDENCE_BYTES = 280 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(blob);
  });
}

export async function prepareEvidenceFile(file: File): Promise<{ fileUrl: string; mimeType: string }> {
  const blob = await compressImage(file, 1024, 1024, 0.75);
  if (blob.size > MAX_EVIDENCE_BYTES) {
    throw new Error(
      `Ảnh quá lớn (${Math.round(blob.size / 1024)}KB). Tối đa ${Math.round(MAX_EVIDENCE_BYTES / 1024)}KB mỗi ảnh.`,
    );
  }
  const fileUrl = await blobToDataUrl(blob);
  return { fileUrl, mimeType: blob.type || 'image/jpeg' };
}

export async function attachEvidenceToCareLog(
  farmId: string,
  careLogId: string,
  files: File[],
): Promise<{ uploaded: number; failed: number }> {
  const capturedAt = new Date().toISOString();
  let uploaded = 0;
  let failed = 0;

  for (const file of files.slice(0, MAX_EVIDENCE_PHOTOS)) {
    try {
      const { fileUrl, mimeType } = await prepareEvidenceFile(file);
      await uploadEvidence(farmId, { careLogId, fileUrl, mimeType, capturedAt });
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }

  return { uploaded, failed };
}

export async function createCareLogWithEvidence(
  farmId: string,
  body: CreateCareLogDto,
  files: File[],
): Promise<{ log: CareLogDto; evidenceUploaded: number; evidenceFailed: number }> {
  const log = await createCareLog(farmId, body);
  if (files.length === 0) {
    return { log, evidenceUploaded: 0, evidenceFailed: 0 };
  }
  const { uploaded, failed } = await attachEvidenceToCareLog(farmId, log.id, files);
  return { log, evidenceUploaded: uploaded, evidenceFailed: failed };
}

/** Chọn ảnh: ZMP chooseImage hoặc file input trình duyệt. */
export async function pickEvidenceImages(maxCount = MAX_EVIDENCE_PHOTOS): Promise<File[]> {
  try {
    const { chooseImage } = await import('zmp-sdk/apis');
    const res = await chooseImage({
      count: maxCount,
      sourceType: ['camera', 'album'],
    });
    const paths = res.filePaths ?? [];
    const files: File[] = [];
    for (let i = 0; i < Math.min(paths.length, maxCount); i++) {
      const blob = await fetch(paths[i]).then((r) => r.blob());
      files.push(
        new File([blob], `evidence-${Date.now()}-${i}.jpg`, {
          type: blob.type || 'image/jpeg',
        }),
      );
    }
    return files;
  } catch {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = () => {
        resolve(Array.from(input.files ?? []).slice(0, maxCount));
      };
      input.click();
    });
  }
}
