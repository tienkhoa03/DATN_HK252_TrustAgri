/**
 * Farmer Process & Diary Screen — Phase 5.2 Integration (FR-F09, FR-F06)
 *
 * Tabs:
 *  - Công việc  — danh sách task hôm nay (checkbox + guide)
 *  - Nhật ký    — danh sách CareLogDto (synced/pending/conflict badge)
 *                 + form tạo nhật ký mới + upload minh chứng + hàng đợi offline
 *  - Tiêu chuẩn — GET /api/v1/standards* (đọc StandardDto / StandardStepDto — FR-F06)
 *
 * Transport: gọi Axios thực tế qua careLogService.ts → API Gateway.
 * Offline queue: IndexedDB (careLogOfflineQueue.ts); tự đồng bộ khi online.
 * Bearer token gắn tự động bởi request interceptor (interceptors.ts).
 * Lỗi hiển thị qua Snackbar ZMP-UI tiếng Việt (ApiError chuẩn).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Page, Text, Modal, useSnackbar } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { listStandards, getStandard } from '@/services/standardService';
import type { StandardDto } from '@/services/standardService';
import {
  listCareLogs,
  createCareLog,
  syncCareLogs,
  uploadEvidence,
} from '@/services/careLogService';
import type { CareLogDto } from '@/services/careLogService';
import {
  enqueue,
  listQueue,
  dequeue,
  generateClientRecordId,
} from '@/services/careLogOfflineQueue';
import { ApiError } from '@/api/errors';

// ── Action type helpers ───────────────────────────────────────────────────────

const ACTION_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'watering',         label: 'Tưới nước',              emoji: '💧' },
  { value: 'fertilizing',      label: 'Bón phân',               emoji: '🌿' },
  { value: 'pest_control',     label: 'Phòng trừ sâu bệnh',     emoji: '🐛' },
  { value: 'pruning',          label: 'Cắt tỉa cành',           emoji: '✂️' },
  { value: 'harvesting',       label: 'Thu hoạch',              emoji: '🌾' },
  { value: 'soil_preparation', label: 'Làm đất',                emoji: '🔨' },
  { value: 'inspection',       label: 'Kiểm tra vườn',          emoji: '🔍' },
  { value: 'other',            label: 'Khác',                   emoji: '📋' },
];

function actionLabel(value: string): string {
  return ACTION_OPTIONS.find((a) => a.value === value)?.label ?? value;
}
function actionEmoji(value: string): string {
  return ACTION_OPTIONS.find((a) => a.value === value)?.emoji ?? '📋';
}

// ── Sync status badge ─────────────────────────────────────────────────────────

const SYNC_CONFIG: Record<
  CareLogDto['syncStatus'],
  { label: string; bg: string; color: string; icon: string }
> = {
  synced:   { label: 'Đã đồng bộ',     bg: `${colors.primary.agriGreen}20`, color: colors.primary.agriGreen, icon: '✓' },
  pending:  { label: 'Chờ đồng bộ',    bg: '#FFCC0020',                     color: '#B8960C',                icon: '⏳' },
  conflict: { label: 'Xung đột',       bg: '#F5000020',                     color: '#F50000',                icon: '⚠' },
};

// ── Local types ───────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  hasGuide?: boolean;
  guideContent?: { text?: string; videoUrl?: string };
}

export interface FarmerProcessScreenProps {
  farmId?: string;
  farmerName?: string;
  farmName?: string;
  currentDay?: number;
  totalDays?: number;
  growthStage?: string;
  tasks?: Task[];
  onTaskToggle?: (taskId: string) => void;
  onBack?: () => void;
}

// ── Form state ────────────────────────────────────────────────────────────────

interface CareLogFormState {
  action: string;
  notes: string;
  performedAt: string;
  standardStepId: string;
  evidenceUrls: string[];
}

function defaultForm(): CareLogFormState {
  const now = new Date();
  now.setSeconds(0, 0);
  return {
    action: 'watering',
    notes: '',
    performedAt: now.toISOString().slice(0, 16),
    standardStepId: '',
    evidenceUrls: [],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const FarmerProcessScreen: React.FC<FarmerProcessScreenProps> = ({
  farmId = 'farm-001',
  farmName = 'Sầu riêng Monthong',
  currentDay = 15,
  totalDays = 90,
  growthStage = 'Ra hoa',
  tasks: initialTasks,
  onTaskToggle,
  onBack,
}) => {
  const { openSnackbar } = useSnackbar();

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'tasks' | 'diary' | 'standards'>('tasks');

  // ── Task tab state ────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? defaultTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // ── Care log / diary state ────────────────────────────────────────────────────
  const [careLogs, setCareLogs] = useState<CareLogDto[]>([]);
  const [careLogsLoading, setCareLogsLoading] = useState(false);
  const careLogsLoadedRef = useRef(false);

  // Create form
  const [showCareLogForm, setShowCareLogForm] = useState(false);
  const [form, setForm] = useState<CareLogFormState>(defaultForm());
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Offline / sync state
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Conflict resolve modal
  const [conflictLog, setConflictLog] = useState<CareLogDto | null>(null);

  // ── Standards tab state ───────────────────────────────────────────────────────
  const [standardList, setStandardList] = useState<StandardDto[]>([]);
  const [standardLoading, setStandardLoading] = useState(false);
  const standardLoadedRef = useRef(false);
  const [selectedStandard, setSelectedStandard] = useState<StandardDto | null>(null);
  const [standardDetailLoading, setStandardDetailLoading] = useState(false);

  // ── Error helpers ─────────────────────────────────────────────────────────────
  const toApiError = (err: unknown): string => {
    if (err instanceof ApiError) {
      switch (err.code) {
        case 'UNAUTHORIZED': return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        case 'NETWORK_ERROR': return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
        case 'SERVICE_UNAVAILABLE': return 'Dịch vụ tạm thời không khả dụng. Thử lại sau.';
        default: return err.message || 'Đã xảy ra lỗi không xác định.';
      }
    }
    return String(err) || 'Đã xảy ra lỗi.';
  };

  // ── Load care logs ────────────────────────────────────────────────────────────
  const loadCareLogs = useCallback(async () => {
    if (careLogsLoading) return;
    setCareLogsLoading(true);
    try {
      const res = await listCareLogs(farmId, { page: 1, limit: 50 });
      setCareLogs(res.items);
    } catch (err) {
      openSnackbar({ text: toApiError(err), type: 'error', duration: 4000 });
    } finally {
      setCareLogsLoading(false);
    }
  }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await listQueue();
      setPendingCount(queue.length);
    } catch {
      // IndexedDB không khả dụng — bỏ qua
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'diary' && !careLogsLoadedRef.current) {
      careLogsLoadedRef.current = true;
      loadCareLogs();
      refreshPendingCount();
    }
  }, [activeTab, loadCareLogs, refreshPendingCount]);

  // ── Auto-sync khi mạng được phục hồi ─────────────────────────────────────────
  useEffect(() => {
    const handleOnline = async () => {
      const queue = await listQueue().catch(() => []);
      if (queue.length === 0) return;
      openSnackbar({ text: 'Đã có mạng — bắt đầu đồng bộ nhật ký offline…', type: 'info', duration: 3000 });
      // Chạy silent sync (không setIsSyncing để không block UI khác)
      try {
        const response = await syncCareLogs(farmId, queue.map((q) => ({
          action: q.action,
          notes: q.notes,
          performedAt: q.performedAt,
          standardStepId: q.standardStepId,
          clientRecordId: q.clientRecordId,
        })));
        let accepted = 0;
        let conflicts = 0;
        for (const result of response.results) {
          if (result.status === 'accepted') {
            accepted++;
            await dequeue(result.clientRecordId);
            setCareLogs((prev) =>
              prev.map((c) =>
                c.clientRecordId === result.clientRecordId
                  ? { ...c, id: result.serverId ?? c.id, syncStatus: 'synced' }
                  : c,
              ),
            );
          } else if (result.status === 'conflicted') {
            conflicts++;
            setCareLogs((prev) =>
              prev.map((c) =>
                c.clientRecordId === result.clientRecordId
                  ? { ...c, syncStatus: 'conflict' }
                  : c,
              ),
            );
          }
        }
        await refreshPendingCount();
        const msg =
          conflicts > 0
            ? `Đồng bộ tự động: ${accepted} thành công, ${conflicts} xung đột cần xử lý.`
            : `Đã đồng bộ tự động ${accepted} nhật ký!`;
        openSnackbar({ text: msg, type: conflicts > 0 ? 'warning' : 'success', duration: 4000 });
      } catch {
        // Sẽ thử lại lần tiếp theo khi mạng ổn định
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [farmId, openSnackbar, refreshPendingCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create care log ───────────────────────────────────────────────────────────
  const handleSubmitCareLog = async () => {
    if (!form.action) {
      openSnackbar({ text: 'Vui lòng chọn loại hoạt động.', type: 'error', duration: 3000 });
      return;
    }
    setFormSubmitting(true);

    const clientRecordId = generateClientRecordId();
    const performedAt = new Date(form.performedAt).toISOString();

    // Thêm vào hàng đợi IndexedDB trước (offline-first)
    try {
      await enqueue({
        clientRecordId,
        farmId,
        action: form.action,
        notes: form.notes || undefined,
        performedAt,
        standardStepId: form.standardStepId || undefined,
        evidenceUrls: form.evidenceUrls,
        queuedAt: new Date().toISOString(),
      });
      await refreshPendingCount();
    } catch {
      // IndexedDB không khả dụng — tiếp tục
    }

    // Thêm optimistic vào UI với status pending
    const optimisticLog: CareLogDto = {
      id: `local-${clientRecordId}`,
      farmId,
      action: form.action,
      notes: form.notes || undefined,
      performedAt,
      standardStepId: form.standardStepId || undefined,
      evidences: [],
      deviation: false,
      syncStatus: 'pending',
      clientRecordId,
    };
    setCareLogs((prev) => [optimisticLog, ...prev]);
    setShowCareLogForm(false);
    setForm(defaultForm());

    // Nếu offline, giữ ở pending và thông báo
    if (!navigator.onLine) {
      openSnackbar({
        text: 'Đang offline — nhật ký đã được lưu cục bộ, sẽ tự đồng bộ khi có mạng.',
        type: 'warning',
        duration: 4000,
      });
      setFormSubmitting(false);
      return;
    }

    try {
      // Gọi API thực — POST /api/v1/farms/:farmId/care-logs
      const saved = await createCareLog(farmId, {
        action: form.action,
        notes: form.notes || undefined,
        performedAt,
        standardStepId: form.standardStepId || undefined,
        clientRecordId,
      });

      // Upload metadata minh chứng — POST /api/v1/farms/:farmId/evidence
      for (const url of form.evidenceUrls) {
        await uploadEvidence(farmId, {
          careLogId: saved.id,
          fileUrl: url,
          mimeType: 'image/jpeg',
          capturedAt: new Date().toISOString(),
        });
      }

      // Cập nhật bản ghi optimistic thành synced
      setCareLogs((prev) =>
        prev.map((c) =>
          c.clientRecordId === clientRecordId
            ? { ...saved, syncStatus: 'synced' }
            : c,
        ),
      );

      // Xóa khỏi IndexedDB
      await dequeue(clientRecordId);
      await refreshPendingCount();

      openSnackbar({ text: 'Đã lưu nhật ký thành công!', type: 'success', duration: 3000 });
    } catch (err) {
      // Giữ ở pending — sẽ đồng bộ khi có mạng
      openSnackbar({
        text: 'Lưu thất bại. Nhật ký đã được lưu offline và sẽ đồng bộ khi có mạng.',
        type: 'warning',
        duration: 4000,
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Sync batch ────────────────────────────────────────────────────────────────
  const handleSyncBatch = async () => {
    if (!navigator.onLine) {
      openSnackbar({ text: 'Không có kết nối mạng. Vui lòng kiểm tra và thử lại.', type: 'error', duration: 3000 });
      return;
    }
    setIsSyncing(true);
    try {
      const queue = await listQueue();
      if (queue.length === 0) {
        openSnackbar({ text: 'Không có nhật ký nào cần đồng bộ.', type: 'success', duration: 2500 });
        return;
      }

      const response = await syncCareLogs(farmId, queue.map((q) => ({
        action: q.action,
        notes: q.notes,
        performedAt: q.performedAt,
        standardStepId: q.standardStepId,
        clientRecordId: q.clientRecordId,
      })));

      let accepted = 0;
      let conflicts = 0;

      for (const result of response.results) {
        if (result.status === 'accepted') {
          accepted++;
          await dequeue(result.clientRecordId);
          setCareLogs((prev) =>
            prev.map((c) =>
              c.clientRecordId === result.clientRecordId
                ? { ...c, id: result.serverId ?? c.id, syncStatus: 'synced' }
                : c,
            ),
          );
        } else if (result.status === 'conflicted') {
          conflicts++;
          setCareLogs((prev) =>
            prev.map((c) =>
              c.clientRecordId === result.clientRecordId
                ? { ...c, syncStatus: 'conflict' }
                : c,
            ),
          );
        }
      }

      await refreshPendingCount();

      const msg =
        conflicts > 0
          ? `Đồng bộ xong: ${accepted} thành công, ${conflicts} xung đột cần xử lý.`
          : `Đã đồng bộ ${accepted} nhật ký thành công!`;
      openSnackbar({ text: msg, type: conflicts > 0 ? 'warning' : 'success', duration: 4000 });
    } catch (err) {
      openSnackbar({ text: `Đồng bộ thất bại: ${toApiError(err)}`, type: 'error', duration: 4000 });
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Chụp ảnh / chọn ảnh minh chứng qua ZMP SDK ──────────────────────────────
  const handleAddEvidence = async () => {
    try {
      // ZMP SDK — chooseImage trả về mảng filePaths (local temp URLs trong Mini App)
      const { chooseImage } = await import('zmp-sdk/apis');
      const result = await chooseImage({ count: 3, sourceType: ['camera', 'album'] });
      const paths: string[] = result.filePaths ?? [];
      if (paths.length > 0) {
        setForm((prev) => ({ ...prev, evidenceUrls: [...prev.evidenceUrls, ...paths] }));
      }
    } catch {
      // Fallback ngoài môi trường Zalo Mini App (dev browser)
      const fakeUrl = `https://placehold.co/300x200/3EBB6C/FFFFFF?text=Anh+${form.evidenceUrls.length + 1}`;
      setForm((prev) => ({ ...prev, evidenceUrls: [...prev.evidenceUrls, fakeUrl] }));
    }
  };

  // ── Standards loaders ─────────────────────────────────────────────────────────
  const loadStandards = useCallback(async () => {
    setStandardLoading(true);
    try {
      const res = await listStandards({ page: 1, limit: 20 });
      setStandardList(res.items);
    } catch (err) {
      openSnackbar({ text: toApiError(err), type: 'error', duration: 4000 });
    } finally {
      setStandardLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openStandardDetail = async (id: string) => {
    setStandardDetailLoading(true);
    setSelectedStandard(null);
    try {
      const s = await getStandard(id);
      setSelectedStandard(s);
    } catch (err) {
      openSnackbar({ text: toApiError(err), type: 'error', duration: 4000 });
    } finally {
      setStandardDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'standards' && !standardLoadedRef.current) {
      standardLoadedRef.current = true;
      loadStandards();
    }
  }, [activeTab, loadStandards]);

  // ── Task helpers ──────────────────────────────────────────────────────────────
  const handleTaskToggle = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );
    onTaskToggle?.(taskId);
  };

  // ── Progress ──────────────────────────────────────────────────────────────────
  const progressPercentage = (currentDay / totalDays) * 100;

  // ── Date formatter ────────────────────────────────────────────────────────────
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Styles ────────────────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const progressBarContainerStyles: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: colors.background.secondary,
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: spacing.sm,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${isActive ? colors.primary.agriGreen : 'transparent'}`,
    color: isActive ? colors.primary.agriGreen : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const cardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    border: `1px solid ${colors.background.secondary}`,
    marginBottom: spacing.md,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '80px',
    right: spacing.md,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: colors.primary.agriGreen,
    border: 'none',
    boxShadow: '0 4px 12px rgba(62, 187, 108, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 999,
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    fontSize: fontSize.body,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    boxSizing: 'border-box',
  };

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
    appearance: 'auto',
  };

  // ── Skeleton card ─────────────────────────────────────────────────────────────
  const SkeletonCard = ({ key: _k }: { key?: number }) => (
    <div style={cardStyles}>
      {[100, 60, 80].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 16 : 11,
            width: `${w}%`,
            backgroundColor: colors.background.secondary,
            borderRadius: 4,
            marginBottom: spacing.sm,
          }}
        />
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Page className="farmer-process-screen">
      {/* ── Header ── */}
      <div style={headerStyles}>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>
            Quy trình canh tác
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {farmName}
          </Text>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ padding: spacing.sm, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Quay lại"
          >
            <Icon name="home" size="md" color={colors.text.primary} />
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: spacing.md, backgroundColor: colors.background.primary }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
            Ngày {currentDay}/{totalDays}
          </Text>
          <Text size="small" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold, margin: 0 }}>
            Giai đoạn: {growthStage}
          </Text>
        </div>
        <div style={progressBarContainerStyles}>
          <div
            style={{
              height: '100%',
              backgroundColor: colors.primary.agriGreen,
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
          {progressPercentage.toFixed(0)}% hoàn thành
        </Text>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${colors.background.secondary}`, backgroundColor: colors.background.primary }}>
        <button style={tabButtonStyles(activeTab === 'tasks')} onClick={() => setActiveTab('tasks')}>📋 Công việc</button>
        <button style={tabButtonStyles(activeTab === 'diary')} onClick={() => setActiveTab('diary')}>📖 Nhật ký</button>
        <button style={tabButtonStyles(activeTab === 'standards')} onClick={() => setActiveTab('standards')}>📜 Tiêu chuẩn</button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ TASKS TAB */}
      {activeTab === 'tasks' && (
        <div style={{ padding: spacing.md, paddingBottom: '80px' }}>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>Công việc hôm nay</Text.Title>
          {tasks.map((task) => (
            <div key={task.id} style={cardStyles}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                <div
                  style={{
                    width: 24, height: 24, minWidth: 24,
                    borderRadius: 4,
                    border: `2px solid ${task.completed ? colors.primary.agriGreen : colors.background.tertiary}`,
                    backgroundColor: task.completed ? colors.primary.agriGreen : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  role="checkbox"
                  aria-checked={task.completed}
                  tabIndex={0}
                  onClick={() => handleTaskToggle(task.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskToggle(task.id); }}
                >
                  {task.completed && <Icon name="check" size="sm" color={colors.text.inverse} />}
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    size="normal"
                    style={{
                      fontWeight: fontWeight.semibold,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? colors.text.secondary : colors.text.primary,
                      margin: 0,
                    }}
                  >
                    {task.title}
                  </Text>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    {task.description}
                  </Text>
                  {task.dueDate && (
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      ⏰ {task.dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                  {task.hasGuide && (
                    <button
                      onClick={() => { setSelectedTask(task); setShowGuideModal(true); }}
                      style={{
                        marginTop: spacing.sm,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.primary.zaloBlue,
                        color: colors.text.inverse,
                        border: 'none', borderRadius: 4,
                        fontSize: fontSize.small, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: spacing.xs,
                      }}
                    >
                      <Icon name="info" size="sm" color={colors.text.inverse} />
                      Xem hướng dẫn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ DIARY TAB */}
      {activeTab === 'diary' && (
        <div style={{ padding: spacing.md, paddingBottom: '80px' }}>

          {/* Offline sync bar */}
          {pendingCount > 0 && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: spacing.md,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FFCC00',
                borderRadius: 8,
                marginBottom: spacing.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{ fontSize: 18 }}>⏳</span>
                <Text size="small" style={{ margin: 0, color: '#B8960C', fontWeight: fontWeight.semibold }}>
                  {pendingCount} nhật ký chờ đồng bộ
                </Text>
              </div>
              <button
                onClick={handleSyncBatch}
                disabled={isSyncing}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: isSyncing ? colors.background.tertiary : colors.primary.agriGreen,
                  color: colors.text.inverse,
                  border: 'none', borderRadius: 6,
                  fontSize: fontSize.small, cursor: isSyncing ? 'not-allowed' : 'pointer',
                  fontWeight: fontWeight.semibold,
                }}
              >
                {isSyncing ? 'Đang đồng bộ…' : '↑ Đồng bộ ngay'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text.Title size="small" style={{ margin: 0 }}>Nhật ký chăm sóc</Text.Title>
            <button
              onClick={() => { careLogsLoadedRef.current = false; loadCareLogs(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.primary.zaloBlue, fontSize: fontSize.small }}
            >
              ↻ Tải lại
            </button>
          </div>

          {/* Skeleton loading */}
          {careLogsLoading && [1, 2, 3].map((k) => <SkeletonCard key={k} />)}

          {/* Empty state */}
          {!careLogsLoading && careLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
              <div style={{ fontSize: 48, marginBottom: spacing.md }}>🌱</div>
              <Text>Chưa có nhật ký nào. Nhấn nút + để ghi nhật ký canh tác đầu tiên!</Text>
            </div>
          )}

          {/* Care log list */}
          {!careLogsLoading && careLogs.map((log) => {
            const sync = SYNC_CONFIG[log.syncStatus];
            return (
              <div key={log.id} style={cardStyles}>
                {/* Top row: action + sync badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <span style={{ fontSize: 20 }}>{actionEmoji(log.action)}</span>
                    <div>
                      <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                        {actionLabel(log.action)}
                      </Text>
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        {fmtDate(log.performedAt)}
                      </Text>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: `2px ${spacing.sm}`,
                      backgroundColor: sync.bg,
                      color: sync.color,
                      borderRadius: 12,
                      fontSize: fontSize.caption ?? '11px',
                      fontWeight: fontWeight.medium,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sync.icon} {sync.label}
                  </span>
                </div>

                {/* Deviation badge */}
                {log.deviation && (
                  <div
                    style={{
                      display: 'inline-block',
                      padding: `2px ${spacing.sm}`,
                      backgroundColor: '#F5000015',
                      color: '#F50000',
                      borderRadius: 4,
                      fontSize: fontSize.caption ?? '11px',
                      marginBottom: spacing.sm,
                    }}
                  >
                    ⚠ Lệch quy trình
                  </div>
                )}

                {/* Notes */}
                {log.notes && (
                  <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                    {log.notes}
                  </Text>
                )}

                {/* Standard step link */}
                {log.standardStepId && (
                  <Text size="xSmall" style={{ color: colors.primary.agriGreen, marginBottom: spacing.sm }}>
                    📜 Liên kết bước quy trình: {log.standardStepId}
                  </Text>
                )}

                {/* Evidence thumbnails */}
                {log.evidences.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(log.evidences.length, 3)}, 1fr)`,
                      gap: spacing.xs,
                    }}
                  >
                    {log.evidences.map((ev) => (
                      <img
                        key={ev.id}
                        src={ev.fileUrl}
                        alt="Minh chứng"
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </div>
                )}

                {/* Conflict action */}
                {log.syncStatus === 'conflict' && (
                  <button
                    onClick={() => setConflictLog(log)}
                    style={{
                      marginTop: spacing.sm,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: '#F5000015',
                      color: '#F50000',
                      border: '1px solid #F50000',
                      borderRadius: 6,
                      fontSize: fontSize.small,
                      cursor: 'pointer',
                    }}
                  >
                    ⚠ Xử lý xung đột
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ STANDARDS TAB */}
      {activeTab === 'standards' && (
        <div style={{ padding: spacing.md, paddingBottom: '80px' }}>
          {selectedStandard ? (
            <div>
              <button
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.background.tertiary}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: fontSize.caption, marginBottom: spacing.md,
                }}
                onClick={() => setSelectedStandard(null)}
              >
                ← Quay lại
              </button>
              <div style={cardStyles}>
                <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>
                  {selectedStandard.name}
                </Text.Title>
                <span
                  style={{
                    display: 'inline-block',
                    padding: `2px ${spacing.sm}`,
                    backgroundColor: `${colors.primary.agriGreen}18`,
                    color: colors.primary.agriGreen,
                    border: `1px solid ${colors.primary.agriGreen}`,
                    borderRadius: 4, fontSize: fontSize.small,
                    fontWeight: fontWeight.medium, marginBottom: spacing.sm,
                  }}
                >
                  {selectedStandard.code}
                </span>
                <Text size="small" style={{ color: colors.text.secondary }}>{selectedStandard.description}</Text>
              </div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Các bước ({selectedStandard.steps.length})
              </Text.Title>
              {selectedStandard.steps
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <div key={step.id} style={cardStyles}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <div
                        style={{
                          minWidth: 26, height: 26, borderRadius: '50%',
                          backgroundColor: `${colors.primary.agriGreen}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: fontSize.small, fontWeight: fontWeight.semibold,
                          color: colors.primary.agriGreen,
                        }}
                      >
                        {step.order}
                      </div>
                      <Text.Title size="xSmall" style={{ margin: 0 }}>{step.title}</Text.Title>
                    </div>
                    <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>
                      {step.description}
                    </Text>
                    {step.expectedDurationDays && (
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        📅 {step.expectedDurationDays} ngày
                      </Text>
                    )}
                    {step.acceptanceCriteria && (
                      <div
                        style={{
                          padding: spacing.sm,
                          backgroundColor: `${colors.primary.agriGreen}10`,
                          borderRadius: 4,
                          borderLeft: `3px solid ${colors.primary.agriGreen}`,
                          marginTop: spacing.xs,
                        }}
                      >
                        <Text size="xSmall" style={{ margin: 0 }}>✓ {step.acceptanceCriteria}</Text>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : standardDetailLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <Text size="small" style={{ color: colors.text.secondary }}>Đang tải…</Text>
            </div>
          ) : (
            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>Tiêu chuẩn canh tác</Text.Title>
              {standardList.length === 0 && !standardLoading && (
                <div style={{ textAlign: 'right', marginBottom: spacing.sm }}>
                  <button
                    onClick={() => { standardLoadedRef.current = false; loadStandards(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.primary.zaloBlue, fontSize: fontSize.small }}
                  >
                    ↻ Tải lại
                  </button>
                </div>
              )}
              {standardLoading
                ? [1, 2, 3].map((k) => <SkeletonCard key={k} />)
                : standardList.length === 0
                  ? <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
                      <Text>Chưa có tiêu chuẩn nào.</Text>
                    </div>
                  : standardList.map((std) => (
                      <div
                        key={std.id}
                        style={{ ...cardStyles, cursor: 'pointer' }}
                        onClick={() => openStandardDetail(std.id)}
                      >
                        <Text.Title size="xSmall" style={{ margin: 0, marginBottom: spacing.xs }}>{std.name}</Text.Title>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: `2px ${spacing.sm}`,
                            backgroundColor: `${colors.primary.agriGreen}18`,
                            color: colors.primary.agriGreen,
                            border: `1px solid ${colors.primary.agriGreen}`,
                            borderRadius: 4, fontSize: fontSize.small,
                            fontWeight: fontWeight.medium, marginBottom: spacing.xs,
                          }}
                        >
                          {std.code}
                        </span>
                        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                          {std.steps.length} bước · Xem chi tiết →
                        </Text>
                      </div>
                    ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAB: only on diary tab ── */}
      {activeTab === 'diary' && (
        <button
          style={fabStyles}
          onClick={() => { setForm(defaultForm()); setShowCareLogForm(true); }}
          aria-label="Thêm nhật ký chăm sóc"
        >
          <Icon name="plus" size="lg" color={colors.text.inverse} />
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════ GUIDE MODAL */}
      <Modal
        visible={showGuideModal}
        title={selectedTask?.title ?? 'Hướng dẫn'}
        onClose={() => { setShowGuideModal(false); setSelectedTask(null); }}
        actions={[{ text: 'Đóng', onClick: () => { setShowGuideModal(false); setSelectedTask(null); } }]}
      >
        <div style={{ padding: spacing.md }}>
          {selectedTask?.guideContent?.text && (
            <div style={{ whiteSpace: 'pre-line', marginBottom: spacing.md }}>
              <Text>{selectedTask.guideContent.text}</Text>
            </div>
          )}
          {selectedTask?.guideContent?.videoUrl && (
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: 8, textAlign: 'center',
              }}
            >
              <Icon name="play" size="lg" color={colors.primary.zaloBlue} />
              <Text size="small" style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
                Video hướng dẫn chi tiết
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════ CARE LOG FORM MODAL */}
      <Modal
        visible={showCareLogForm}
        title="📖 Ghi nhật ký chăm sóc"
        onClose={() => !formSubmitting && setShowCareLogForm(false)}
        actions={[
          { text: 'Hủy', onClick: () => !formSubmitting && setShowCareLogForm(false) },
          { text: formSubmitting ? 'Đang lưu…' : 'Lưu nhật ký', onClick: handleSubmitCareLog },
        ]}
      >
        <div style={{ padding: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.md }}>

          {/* Action */}
          <div>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
              Loại hoạt động <span style={{ color: '#F50000' }}>*</span>
            </Text>
            <select
              style={selectStyles}
              value={form.action}
              onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
              disabled={formSubmitting}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Performed At */}
          <div>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
              Thời gian thực hiện
            </Text>
            <input
              type="datetime-local"
              style={inputStyles}
              value={form.performedAt}
              onChange={(e) => setForm((p) => ({ ...p, performedAt: e.target.value }))}
              disabled={formSubmitting}
            />
          </div>

          {/* Standard Step */}
          {standardList.length > 0 && (
            <div>
              <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
                Liên kết bước quy trình (tùy chọn)
              </Text>
              <select
                style={selectStyles}
                value={form.standardStepId}
                onChange={(e) => setForm((p) => ({ ...p, standardStepId: e.target.value }))}
                disabled={formSubmitting}
              >
                <option value="">— Không liên kết —</option>
                {standardList.flatMap((std) =>
                  std.steps.map((step) => (
                    <option key={step.id} value={step.id}>
                      [{std.code}] Bước {step.order}: {step.title}
                    </option>
                  )),
                )}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
              Ghi chú
            </Text>
            <textarea
              style={{ ...inputStyles, minHeight: 80, resize: 'vertical' }}
              placeholder="Mô tả chi tiết công việc đã thực hiện…"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              disabled={formSubmitting}
            />
          </div>

          {/* Evidence upload */}
          <div>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
              Minh chứng ({form.evidenceUrls.length} ảnh)
            </Text>
            {form.evidenceUrls.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(form.evidenceUrls.length, 3)}, 1fr)`,
                  gap: spacing.xs,
                  marginBottom: spacing.sm,
                }}
              >
                {form.evidenceUrls.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Ảnh ${idx + 1}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4 }}
                    />
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          evidenceUrls: p.evidenceUrls.filter((_, i) => i !== idx),
                        }))
                      }
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 18, height: 18, borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff', border: 'none',
                        fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      aria-label="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleAddEvidence}
              disabled={formSubmitting}
              style={{
                width: '100%',
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: `2px dashed ${colors.background.tertiary}`,
                borderRadius: 8,
                color: colors.text.secondary,
                fontSize: fontSize.small,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
              }}
            >
              <Icon name="camera" size="sm" color={colors.text.secondary} />
              Thêm ảnh minh chứng
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════ CONFLICT RESOLVE MODAL */}
      <Modal
        visible={!!conflictLog}
        title="⚠ Xử lý xung đột"
        onClose={() => setConflictLog(null)}
        actions={[
          {
            text: 'Giữ bản local',
            onClick: async () => {
              if (!conflictLog) return;
              setCareLogs((prev) =>
                prev.map((c) =>
                  c.id === conflictLog.id ? { ...c, syncStatus: 'pending' } : c,
                ),
              );
              await refreshPendingCount();
              setConflictLog(null);
              openSnackbar({ text: 'Giữ bản local. Sẽ đồng bộ lại khi xác nhận.', type: 'info', duration: 3000 });
            },
          },
          {
            text: 'Bỏ qua (giữ server)',
            onClick: () => {
              if (!conflictLog) return;
              setCareLogs((prev) => prev.filter((c) => c.id !== conflictLog.id));
              setConflictLog(null);
              openSnackbar({ text: 'Đã bỏ bản local, giữ dữ liệu trên máy chủ.', type: 'success', duration: 3000 });
            },
          },
        ]}
      >
        <div style={{ padding: spacing.md }}>
          <Text size="small" style={{ marginBottom: spacing.md }}>
            Bản ghi này đã được cập nhật bởi thiết bị khác trên máy chủ. Bạn muốn làm gì?
          </Text>
          {conflictLog && (
            <div style={{ ...cardStyles, backgroundColor: `${colors.background.secondary}` }}>
              <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                {actionEmoji(conflictLog.action)} {actionLabel(conflictLog.action)}
              </Text>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                {fmtDate(conflictLog.performedAt)}
              </Text>
              {conflictLog.notes && (
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  {conflictLog.notes}
                </Text>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Page>
  );
};

export default FarmerProcessScreen;

// ── Default tasks seed (unchanged from Phase 4) ───────────────────────────────

const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Tưới nước buổi sáng',
    description: 'Tưới đều 20 lít/cây, tránh úng rễ',
    completed: true,
    dueDate: new Date(),
    hasGuide: true,
    guideContent: {
      text: 'Hướng dẫn tưới nước:\n\n1. Kiểm tra độ ẩm đất trước khi tưới\n2. Tưới đều xung quanh gốc cây\n3. Tránh tưới vào lúc trời nắng gắt\n4. Đảm bảo nước thoát tốt, không úng\n\nLưu ý: Giai đoạn ra hoa cần giữ độ ẩm ổn định 60-70%',
      videoUrl: 'https://example.com/watering-guide.mp4',
    },
  },
  {
    id: '2',
    title: 'Bón phân lá',
    description: 'Phun phân lá NPK 20-20-20, pha loãng 2g/lít',
    completed: false,
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    hasGuide: true,
    guideContent: {
      text: 'Hướng dẫn bón phân lá:\n\n1. Pha phân NPK 20-20-20 với tỷ lệ 2g/1 lít nước\n2. Phun đều vào mặt dưới lá\n3. Thực hiện vào buổi chiều mát\n4. Tránh phun khi trời mưa',
    },
  },
  {
    id: '3',
    title: 'Kiểm tra sâu bệnh',
    description: 'Quan sát lá, thân, hoa để phát hiện sâu bệnh sớm',
    completed: false,
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    hasGuide: true,
    guideContent: {
      text: 'Hướng dẫn kiểm tra sâu bệnh:\n\n1. Quan sát mặt trên và dưới lá\n2. Kiểm tra thân cây có vết lạ\n3. Xem hoa có bị sâu đục không\n4. Chụp ảnh nếu phát hiện bất thường',
    },
  },
  {
    id: '4',
    title: 'Ghi nhận nhiệt độ và độ ẩm',
    description: 'Kiểm tra và ghi lại các chỉ số môi trường',
    completed: false,
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    hasGuide: false,
  },
];
