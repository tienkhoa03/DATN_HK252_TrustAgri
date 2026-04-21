/**
 * Mock Care Log Service — Phase 5.1 (FR-F09)
 *
 * Giả lập Care Log Service (dùng thủ công / test; không gắn VITE_USE_MOCK).
 * Types import từ careLogService.ts (nguồn sự thật duy nhất về hợp đồng DTO).
 *
 * Mỗi hàm trả Promise với độ trễ ~1 giây qua withMockDelay,
 * JSON khớp 1-1 với hợp đồng CareLogDto / EvidenceDto / CareLogSyncResponse
 * trong specs/backend-api-specification/design.md §4.3.
 *
 * Seed data: nhật ký thực tế cho farm-001 (Vườn thanh long Tiến Khoa).
 * syncStatus đa dạng: synced / pending / conflict để demo đủ trạng thái.
 */

import { withMockDelay } from './index';
import type {
  CareLogDto,
  EvidenceDto,
  CareLogSyncResponse,
  ListResponse,
  ListCareLogsParams,
  CreateCareLogDto,
  UploadEvidenceBody,
} from '@/services/careLogService';

export type {
  CareLogDto,
  EvidenceDto,
  CareLogSyncResponse,
  ListResponse,
  ListCareLogsParams,
  CreateCareLogDto,
  UploadEvidenceBody,
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const SEED_CARE_LOGS: CareLogDto[] = [
  {
    id: 'cl-001',
    farmId: 'farm-001',
    standardStepId: 'step-vg-03',
    action: 'watering',
    notes: 'Tưới đủ nước sáng sớm. Độ ẩm đất đạt khoảng 65%. Cây phát triển tốt, lá xanh đều.',
    performedAt: daysAgo(3),
    evidences: [
      {
        id: 'ev-001',
        careLogId: 'cl-001',
        fileUrl: 'https://placehold.co/300x200/3EBB6C/FFFFFF?text=T%C6%B0%E1%BB%9Bi+n%C6%B0%E1%BB%9Bc',
        mimeType: 'image/jpeg',
        capturedAt: daysAgo(3),
      },
      {
        id: 'ev-002',
        careLogId: 'cl-001',
        fileUrl: 'https://placehold.co/300x200/3EBB6C/FFFFFF?text=%C4%90%E1%BB%99+%E1%BA%A9m+%C4%91%E1%BA%A5t',
        mimeType: 'image/jpeg',
        capturedAt: daysAgo(3),
      },
    ],
    deviation: false,
    syncStatus: 'synced',
    clientRecordId: 'crid-001',
  },
  {
    id: 'cl-002',
    farmId: 'farm-001',
    standardStepId: 'step-vg-02',
    action: 'fertilizing',
    notes: 'Bón phân NPK 20-20-20 pha 2g/lít. Phun đều mặt dưới lá vào buổi chiều mát.',
    performedAt: daysAgo(2),
    evidences: [
      {
        id: 'ev-003',
        careLogId: 'cl-002',
        fileUrl: 'https://placehold.co/300x200/FFCC00/333333?text=B%C3%B3n+ph%C3%A2n',
        mimeType: 'image/jpeg',
        capturedAt: daysAgo(2),
      },
    ],
    deviation: false,
    syncStatus: 'synced',
    clientRecordId: 'crid-002',
  },
  {
    id: 'cl-003',
    farmId: 'farm-001',
    action: 'inspection',
    notes: 'Kiểm tra phát hiện một số lá có dấu hiệu đốm vàng nhỏ. Cần theo dõi thêm 1–2 ngày.',
    performedAt: daysAgo(1),
    evidences: [
      {
        id: 'ev-004',
        careLogId: 'cl-003',
        fileUrl: 'https://placehold.co/300x200/F50000/FFFFFF?text=%C4%90%E1%BB%91m+v%C3%A0ng',
        mimeType: 'image/jpeg',
        capturedAt: daysAgo(1),
      },
    ],
    deviation: true,
    syncStatus: 'synced',
    clientRecordId: 'crid-003',
  },
  {
    id: 'cl-004',
    farmId: 'farm-001',
    standardStepId: 'step-vg-05',
    action: 'pest_control',
    notes: 'Phun thuốc sinh học phòng sâu đục nụ. Nồng độ theo khuyến cáo VietGAP.',
    performedAt: daysAgo(0),
    evidences: [],
    deviation: false,
    syncStatus: 'pending',
    clientRecordId: 'crid-004',
  },
  {
    id: 'cl-005',
    farmId: 'farm-001',
    action: 'pruning',
    notes: 'Cắt tỉa cành yếu phía dưới. Đã cắt 12 cành, vết cắt sạch.',
    performedAt: daysAgo(1),
    evidences: [],
    deviation: false,
    syncStatus: 'conflict',
    clientRecordId: 'crid-005',
  },
];

// Lưu trữ in-memory cho mỗi farmId
type FarmCareLogStore = Record<string, CareLogDto[]>;
const careLogStore: FarmCareLogStore = {
  'farm-001': [...SEED_CARE_LOGS],
};

function getStore(farmId: string): CareLogDto[] {
  if (!careLogStore[farmId]) careLogStore[farmId] = [];
  return careLogStore[farmId];
}

// ── Service functions (mirror careLogService.ts API surface) ──────────────────

/**
 * GET /api/v1/farms/:farmId/care-logs
 * Danh sách nhật ký, sắp xếp mới nhất trước (performedAt DESC).
 */
export async function listCareLogs(
  farmId: string,
  params: ListCareLogsParams = {},
): Promise<ListResponse<CareLogDto>> {
  const { page = 1, limit = 20 } = params;

  const all = [...getStore(farmId)].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
  );

  const total = all.length;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);

  return withMockDelay({ items, page, limit, total });
}

/**
 * POST /api/v1/farms/:farmId/care-logs
 * Tạo một nhật ký mới — server luôn trả về syncStatus: 'synced'.
 */
export async function createCareLog(
  farmId: string,
  body: CreateCareLogDto,
): Promise<CareLogDto> {
  const newLog: CareLogDto = {
    id: `cl-${Date.now()}`,
    farmId,
    standardStepId: body.standardStepId,
    action: body.action,
    notes: body.notes,
    performedAt: body.performedAt,
    evidences: [],
    deviation: false,
    syncStatus: 'synced',
    clientRecordId: body.clientRecordId,
  };

  careLogStore[farmId] = [newLog, ...(careLogStore[farmId] ?? [])];
  return withMockDelay({ ...newLog });
}

/**
 * POST /api/v1/farms/:farmId/care-logs/sync
 * Batch sync — xử lý từng bản ghi qua clientRecordId.
 * Mock: tất cả đều accepted ngoại trừ 'crid-005' bị giả lập conflict.
 */
export async function syncBatch(
  farmId: string,
  logs: CreateCareLogDto[],
): Promise<CareLogSyncResponse> {
  const results: CareLogSyncResponse['results'] = logs.map((log) => {
    // Giả lập xung đột cho demo — trong thực tế server quyết định
    if (log.clientRecordId === 'crid-005') {
      return {
        clientRecordId: log.clientRecordId ?? '',
        status: 'conflicted',
        reason: 'Bản ghi trên máy chủ đã được cập nhật bởi thiết bị khác.',
      };
    }
    const serverId = `cl-sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Cập nhật store về synced
    const store = getStore(farmId);
    const idx = store.findIndex((c) => c.clientRecordId === log.clientRecordId);
    if (idx !== -1) {
      store[idx] = { ...store[idx], syncStatus: 'synced', id: serverId };
    } else {
      store.push({
        id: serverId,
        farmId,
        action: log.action,
        notes: log.notes,
        performedAt: log.performedAt,
        standardStepId: log.standardStepId,
        evidences: [],
        deviation: false,
        syncStatus: 'synced',
        clientRecordId: log.clientRecordId,
      });
    }
    return { clientRecordId: log.clientRecordId ?? '', status: 'accepted', serverId };
  });

  return withMockDelay({ results });
}

/**
 * POST /api/v1/farms/:farmId/evidence
 * Lưu metadata minh chứng (ảnh) cho một care log.
 */
export async function uploadEvidence(
  farmId: string,
  body: UploadEvidenceBody,
): Promise<EvidenceDto> {
  const evidence: EvidenceDto = {
    id: `ev-${Date.now()}`,
    careLogId: body.careLogId,
    fileUrl: body.fileUrl,
    mimeType: body.mimeType,
    capturedAt: body.capturedAt,
  };

  // Gắn vào care log trong store
  const store = getStore(farmId);
  const logIdx = store.findIndex((c) => c.id === body.careLogId);
  if (logIdx !== -1) {
    store[logIdx] = {
      ...store[logIdx],
      evidences: [...store[logIdx].evidences, evidence],
    };
  }

  return withMockDelay({ ...evidence });
}
