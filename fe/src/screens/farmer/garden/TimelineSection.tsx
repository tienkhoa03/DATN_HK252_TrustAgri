/**
 * TimelineSection — care-plan timeline with injected alert nodes (FR-F09, FR-F07)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { Timeline } from '@/design-system/components/Timeline';
import type { TimelineNode } from '@/design-system/components/Timeline';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useCarePlan } from '@/hooks/useCarePlan';
import { useMonitoring } from '@/hooks/useMonitoring';
import { getStandard } from '@/services/standardService';
import type { StandardStepDto, StandardDto } from '@/services/standardService';
import type { DailyTaskDto } from '@/services/carePlanService';
import type { AlertDto } from '@/services/monitoringService';
import { listCareLogs, type CareLogDto } from '@/services/careLogService';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { QuickUpdateSheet } from './QuickUpdateSheet';
import { StepDetailSheet } from './StepDetailSheet';

function getTodayUtcStr(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Tính ngày dự kiến (YYYY-MM-DD) cho mọi step từ plantingDate + expectedDurationDays tích lũy
function computeStepDueDates(steps: StandardStepDto[], plantingDate: string): Map<string, string> {
  const map = new Map<string, string>();
  let dayOffset = 0;
  for (const step of steps) {
    const d = new Date(plantingDate);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    map.set(step.id, d.toISOString().slice(0, 10));
    dayOffset += step.expectedDurationDays ?? 1;
  }
  return map;
}

export interface TimelineSectionProps {
  farmId: string | null;
  standardId?: string;
  initialStep?: string;
}

function buildTimelineNodes(
  steps: StandardStepDto[],
  tasks: DailyTaskDto[],
  logsByStepId: Map<string, CareLogDto>,
  expectedDueDates: Map<string, string>,
  today: string,
  alerts: AlertDto[],
  onStepAction: (step: StandardStepDto) => void,
  onStepDetail: (step: StandardStepDto) => void,
): TimelineNode[] {
  const taskMap = new Map(tasks.map((t) => [t.standardStepId, t]));
  const unackedAlerts = alerts.filter((a) => !a.acknowledged);

  // Relative day labels — used as fallback when no absolute planting date exists
  const stepDayLabels = new Map<string, string>();
  let labelOffset = 0;
  for (const step of steps) {
    const startDay = labelOffset + 1;
    const duration = step.expectedDurationDays ?? 1;
    const endDay = labelOffset + duration;
    stepDayLabels.set(step.id, startDay === endDay ? `Ngày ${startDay}` : `Ngày ${startDay}–${endDay}`);
    labelOffset += duration;
  }

  const nodes: TimelineNode[] = [];

  const isStepDone = (stepId: string) =>
    taskMap.get(stepId)?.completed === true || logsByStepId.has(stepId);

  steps.forEach((step, idx) => {
    const task = taskMap.get(step.id);
    const careLog = logsByStepId.get(step.id);

    const done = isStepDone(step.id);
    const completedAt = task?.completedAt ?? careLog?.performedAt;
    // Ưu tiên dueDate từ care plan (đã tính đúng ở BE), fallback sang FE-computed
    const dueDate = task?.dueDate ?? expectedDueDates.get(step.id);
    // Relative label shown when no absolute date is available
    const dueDayLabel = dueDate ? undefined : stepDayLabels.get(step.id);

    let status: TimelineNode['status'];
    if (done) {
      status = 'completed';
    } else if (dueDate && today >= dueDate) {
      status = 'in-progress'; // đến hạn hoặc quá hạn → xanh dương
    } else {
      status = 'pending'; // chưa đến ngày → xám
    }

    nodes.push({
      id: step.id,
      number: step.order,
      title: step.title,
      description: step.description,
      status,
      dueDate,
      dueDayLabel,
      completedAt,
      onAction: status === 'completed' ? () => onStepDetail(step) : () => onStepAction(step),
      actionLabel: status === 'completed' ? 'Xem chi tiết' : 'Cập nhật',
    });

    // Inject alerts after last completed step (insert before first in-progress/pending)
    if (status === 'in-progress' && unackedAlerts.length > 0 && nodes.length === 1 + idx) {
      unackedAlerts.forEach((alert) => {
        nodes.push({
          id: `alert-${alert.id}`,
          title: `⚠ Cảnh báo: ${alert.sensorType}`,
          description: alert.suggestedAction ?? `Giá trị ${alert.value} vượt ngưỡng ${alert.threshold}.`,
          status: 'alert-suggested',
          isAlert: true,
        });
      });
    }
  });

  return nodes;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ farmId, standardId, initialStep }) => {
  const openSnackbar = useStableOpenSnackbar();
  const { plan, tasks, isLoading: planLoading, error: planError, clearError: clearPlanError, reload } = useCarePlan(farmId);
  const { alerts } = useMonitoring(farmId);
  const [standard, setStandard] = useState<StandardDto | null>(null);
  const [stdLoading, setStdLoading] = useState(false);
  const [logsByStepId, setLogsByStepId] = useState<Map<string, CareLogDto>>(new Map());
  const [logsLoading, setLogsLoading] = useState(false);
  const [sheetState, setSheetState] = useState<{ open: boolean; step?: StandardStepDto }>({ open: false });
  const [detailSheetState, setDetailSheetState] = useState<{ open: boolean; step?: StandardStepDto }>({ open: false });
  const loadedStdRef = useRef<string | null>(null);

  useEffect(() => {
    if (planError) { openSnackbar({ type: 'error', text: planError, duration: 3500, icon: true }); clearPlanError(); }
  }, [planError, openSnackbar, clearPlanError]);

  // Load standard — chỉ khi farm có standardId, không fallback
  useEffect(() => {
    const idToLoad = standardId ?? null;
    if (!idToLoad) {
      setStandard(null);
      loadedStdRef.current = null;
      return;
    }
    if (loadedStdRef.current === idToLoad) return;
    setStdLoading(true);
    getStandard(idToLoad).then((s) => {
      setStandard(s);
      loadedStdRef.current = s.id;
      setStdLoading(false);
    }).catch(() => {
      setStdLoading(false);
    });
  }, [standardId]);

  // Fetch care logs trực tiếp để biết bước nào đã có care log (độc lập với getTodayPlan)
  const reloadCareLogs = useCallback(async () => {
    if (!farmId) return;
    setLogsLoading(true);
    try {
      const res = await listCareLogs(farmId, { limit: 200 });
      // Xây map stepId → care log sớm nhất (iterate DESC → overwrite → cuối cùng là oldest)
      const map = new Map<string, CareLogDto>();
      for (const log of res.items) {
        if (log.standardStepId) map.set(log.standardStepId, log);
      }
      setLogsByStepId(map);
    } catch {
      // bỏ qua lỗi, timeline vẫn hiển thị với data từ getTodayPlan
    } finally {
      setLogsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId) void reloadCareLogs();
    else setLogsByStepId(new Map());
  }, [farmId, reloadCareLogs]);

  // Mở đúng sheet (cập nhật vs chi tiết) cho bước từ URL param
  useEffect(() => {
    if (!initialStep || !standard) return;
    const step = standard.steps.find((s) => s.id === initialStep);
    if (!step) return;
    const task = tasks.find((t) => t.standardStepId === initialStep);
    if (task?.completed || logsByStepId.has(initialStep)) {
      setDetailSheetState({ open: true, step });
    } else {
      setSheetState({ open: true, step });
    }
  }, [initialStep, standard, tasks, logsByStepId]);

  const loading = planLoading || stdLoading || logsLoading;

  if (loading) {
    return (
      <div style={{ padding: `${spacing.sm} ${spacing.md}` }}>
        <div style={{ height: 300, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
      </div>
    );
  }

  if (!standard) {
    return (
      <EmptyState
        icon="📋"
        title="Chưa có quy trình"
        description="Vườn chưa được gán tiêu chuẩn sản xuất."
      />
    );
  }

  const today = getTodayUtcStr();
  const expectedDueDates = plan?.plantingDate
    ? computeStepDueDates(standard.steps, plan.plantingDate)
    : new Map<string, string>();

  const nodes = buildTimelineNodes(
    standard.steps,
    tasks,
    logsByStepId,
    expectedDueDates,
    today,
    alerts,
    (step) => setSheetState({ open: true, step }),
    (step) => setDetailSheetState({ open: true, step }),
  );

  const handleCareLogSuccess = () => {
    void reload();
    void reloadCareLogs();
  };

  return (
    <div style={{ marginTop: spacing.sm }}>
      <div style={{ padding: `0 ${spacing.md} ${spacing.sm}` }}>
        <Text.Title size="small" style={{ margin: 0 }}>
          Quy trình: {standard.name}
        </Text.Title>
      </div>
      <Timeline nodes={nodes} />
      <QuickUpdateSheet
        open={sheetState.open}
        onClose={() => setSheetState({ open: false })}
        farmId={farmId ?? ''}
        standardStepId={sheetState.step?.id}
        stepTitle={sheetState.step?.title}
        onSuccess={() => {
          setSheetState({ open: false });
          handleCareLogSuccess();
        }}
      />
      <StepDetailSheet
        open={detailSheetState.open}
        onClose={() => setDetailSheetState({ open: false })}
        farmId={farmId ?? ''}
        standardStepId={detailSheetState.step?.id}
        stepTitle={detailSheetState.step?.title}
        onSuccess={handleCareLogSuccess}
      />
    </div>
  );
};

export default TimelineSection;
