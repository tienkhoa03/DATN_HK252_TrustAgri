/**
 * TimelineSection — care-plan timeline with injected alert nodes (FR-F09, FR-F07)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'zmp-ui';
import { Timeline } from '@/design-system/components/Timeline';
import type { TimelineNode } from '@/design-system/components/Timeline';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useCarePlan } from '@/hooks/useCarePlan';
import { useMonitoring } from '@/hooks/useMonitoring';
import { getStandard, listStandards } from '@/services/standardService';
import type { StandardStepDto, StandardDto } from '@/services/standardService';
import type { DailyTaskDto } from '@/services/carePlanService';
import type { AlertDto } from '@/services/monitoringService';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { QuickUpdateSheet } from './QuickUpdateSheet';

export interface TimelineSectionProps {
  farmId: string | null;
  standardId?: string;
  initialStep?: string;
}

function buildTimelineNodes(
  steps: StandardStepDto[],
  tasks: DailyTaskDto[],
  alerts: AlertDto[],
  onStepAction: (step: StandardStepDto) => void,
): TimelineNode[] {
  const taskMap = new Map(tasks.map((t) => [t.standardStepId, t]));
  const unackedAlerts = alerts.filter((a) => !a.acknowledged);

  const nodes: TimelineNode[] = [];

  steps.forEach((step, idx) => {
    const task = taskMap.get(step.id);
    let status: TimelineNode['status'] = 'pending';
    if (task?.completed) status = 'completed';
    else if (idx === 0 || (steps[idx - 1] && taskMap.get(steps[idx - 1].id)?.completed)) {
      status = 'in-progress';
    }

    nodes.push({
      id: step.id,
      number: step.order,
      title: step.title,
      description: step.description,
      status,
      dueDate: task?.dueDate ?? undefined,
      onAction: status !== 'completed' ? () => onStepAction(step) : undefined,
      actionLabel: status !== 'completed' ? 'Cập nhật' : undefined,
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
  const { tasks, isLoading: planLoading, error: planError, clearError: clearPlanError } = useCarePlan(farmId);
  const { alerts } = useMonitoring(farmId);
  const [standard, setStandard] = useState<StandardDto | null>(null);
  const [stdLoading, setStdLoading] = useState(false);
  const [sheetState, setSheetState] = useState<{ open: boolean; step?: StandardStepDto }>({ open: false });
  const loadedStdRef = useRef<string | null>(null);

  useEffect(() => {
    if (planError) { openSnackbar({ type: 'error', text: planError, duration: 3500, icon: true }); clearPlanError(); }
  }, [planError, openSnackbar, clearPlanError]);

  // Load standard
  useEffect(() => {
    const idToLoad = standardId ?? null;
    if (!idToLoad) {
      // Fallback: load first standard
      setStdLoading(true);
      listStandards({ limit: 1 }).then((res) => {
        const first = res.items[0];
        if (first) { setStandard(first); loadedStdRef.current = first.id; }
        setStdLoading(false);
      }).catch(() => setStdLoading(false));
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

  // Open sheet for a specific step from URL param
  useEffect(() => {
    if (!initialStep || !standard) return;
    const step = standard.steps.find((s) => s.id === initialStep);
    if (step) setSheetState({ open: true, step });
  }, [initialStep, standard]);

  const loading = planLoading || stdLoading;

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

  const nodes = buildTimelineNodes(standard.steps, tasks, alerts, (step) => {
    setSheetState({ open: true, step });
  });

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
        onSuccess={() => setSheetState({ open: false })}
      />
    </div>
  );
};

export default TimelineSection;
