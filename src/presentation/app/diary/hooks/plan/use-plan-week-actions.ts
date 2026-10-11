import { useCallback } from 'react';
import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { t } from '@presentation/i18n';

interface PlanWeekActions {
  copyLastWeek: () => void;
  clearWeek: () => void;
}

/**
 * The week menu (design spec → Meal planner): copy last week into this one
 * (the server skips days that have passed), and clear the week with an Undo
 * that plans its meals again. Meals already logged stay in the diary either way.
 */
export const usePlanWeekActions = (weekStart: CalendarDate): PlanWeekActions => {
  const { mealPlanStore } = useStores();

  const copyLastWeek = useCallback(async () => {
    const result = await mealPlanStore.getState().copyPreviousWeek(weekStart);
    if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
    const { copied } = result.value;
    const strings = t().mealPlan;
    toastStore.getState().show({
      severity: SeverityType.Neutral,
      message: copied > ValueConstants.zero ? strings.copied.replace('{n}', String(copied)) : strings.nothingToCopy,
    });
  }, [mealPlanStore, weekStart]);

  const clearWeek = useCallback(async () => {
    const result = await mealPlanStore.getState().clearWeek(weekStart);
    if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
    const held = result.value;
    toastStore.getState().show({
      severity: SeverityType.Neutral,
      message: t().mealPlan.weekCleared,
      ...(held.length === ValueConstants.zero
        ? {}
        : {
            actionLabel: t().mealPlan.undo,
            onAction: () => void mealPlanStore.getState().restore(held).then((restored) => (restored.ok ? undefined : showErrorToast(restored.failure))),
          }),
    });
  }, [mealPlanStore, weekStart]);

  return { copyLastWeek: () => void copyLastWeek(), clearWeek: () => void clearWeek() };
};
