/**
 * useCarePlan — load lịch công việc hôm nay theo farm + standard (Phase B2).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTodayPlan,
  completeCareTask,
  toCarePlanViMessage,
  type CarePlanResponseDto,
  type DailyTaskDto,
} from '@/services/carePlanService';

export interface UseCarePlanReturn {
  plan: CarePlanResponseDto | null;
  tasks: DailyTaskDto[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  reload: () => Promise<void>;
  complete: (standardStepId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useCarePlan(farmId: string | null | undefined): UseCarePlanReturn {
  const [plan, setPlan] = useState<CarePlanResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(async () => {
    if (!farmId || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTodayPlan(farmId);
      setPlan(res);
    } catch (err) {
      setError(toCarePlanViMessage(err, 'today'));
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId) void reload();
    else setPlan(null);
  }, [farmId, reload]);

  const complete = useCallback(
    async (standardStepId: string): Promise<boolean> => {
      if (!farmId) return false;
      setIsMutating(true);
      setError(null);
      try {
        await completeCareTask(farmId, standardStepId);
        // Optimistic mark completed
        setPlan((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) =>
                  t.standardStepId === standardStepId
                    ? { ...t, completed: true, completedAt: new Date().toISOString() }
                    : t,
                ),
              }
            : prev,
        );
        return true;
      } catch (err) {
        setError(toCarePlanViMessage(err, 'complete'));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [farmId],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    plan,
    tasks: plan?.tasks ?? [],
    isLoading,
    isMutating,
    error,
    reload,
    complete,
    clearError,
  };
}
