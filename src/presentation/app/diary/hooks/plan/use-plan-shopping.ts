import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { t } from '@presentation/i18n';

interface PlanShoppingModel {
  /** Null while the week's ingredients load. */
  lines: readonly PlanShoppingLine[] | null;
  failure: Failure | null;
  selected: ReadonlySet<string>;
  isSubmitting: boolean;
  toggle: (key: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  retry: () => void;
  submit: () => Promise<void>;
}

const NO_LINES: readonly PlanShoppingLine[] = [];

/**
 * The shopping confirm's state (design spec → Meal planner, Shopping
 * confirm): the week's merged ingredients, every line ticked but the staples,
 * and "Add N items" sending the ticked lines' drafts to the shopping list.
 * Read again each time the sheet opens, so it follows the plan.
 */
export const usePlanShopping = (open: boolean, weekStart: CalendarDate, onDone: () => void): PlanShoppingModel => {
  const router = useRouter();
  const { mealPlanStore, shoppingListStore } = useStores();
  const [lines, setLines] = useState<readonly PlanShoppingLine[] | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [isSubmitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<number>(ValueConstants.zero);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLines(null);
    setFailure(null);
    void mealPlanStore.getState().shoppingList(weekStart).then((result) => {
      if (!live) return;
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      setLines(result.value);
      setSelected(new Set(result.value.filter((line) => !line.isStaple).map((line) => line.key)));
    });
    return () => {
      live = false;
    };
  }, [attempt, mealPlanStore, open, weekStart]);

  const toggle = useCallback((key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    const chosen = (lines ?? NO_LINES).filter((line) => selected.has(line.key));
    setSubmitting(true);
    const result = await shoppingListStore.getState().addDrafts(chosen.flatMap((line) => line.drafts));
    setSubmitting(false);
    if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
    onDone();
    const strings = t().mealPlan;
    toastStore.getState().show({
      severity: SeverityType.Success,
      message: strings.itemsAdded.replace('{n}', String(chosen.length)),
      actionLabel: strings.viewList,
      onAction: () => router.push(RoutePaths.shoppingList),
    });
  }, [lines, onDone, router, selected, shoppingListStore]);

  return {
    lines,
    failure,
    selected,
    isSubmitting,
    toggle,
    selectAll: useCallback(() => setSelected(new Set((lines ?? NO_LINES).map((line) => line.key))), [lines]),
    clearAll: useCallback(() => setSelected(new Set()), []),
    retry: useCallback(() => setAttempt((n) => n + ValueConstants.one), []),
    submit,
  };
};
