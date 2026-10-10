import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';
import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';
import { t, useLocale } from '@presentation/i18n';

interface PlanEntryActions {
  /** +1 or −1 servings (half steps); an eaten meal or a bound does nothing. */
  stepServings: (entry: MealPlanEntryEntity, direction: number) => void;
  toggleEaten: (entry: MealPlanEntryEntity) => void;
  remove: (entry: MealPlanEntryEntity) => void;
  move: (entry: MealPlanEntryEntity, date: CalendarDate, meal: MealSlotType) => void;
  openRecipe: (entry: MealPlanEntryEntity) => void;
}

/**
 * What a planned meal can do (design spec → Meal planner, Meal actions).
 *
 * @remarks
 * - **Eating is the server's diary write** (`POST /entries/:id/eaten`); the
 *   diary day is re-read afterwards so the Log shows it.
 * - **Remove offers Undo**, which plans the same meal again.
 * - Every refusal is a toast; the store has already put the old state back.
 */
export const usePlanEntryActions = (today: CalendarDate): PlanEntryActions => {
  const router = useRouter();
  const locale = useLocale();
  const { mealPlanStore, diaryStore } = useStores();

  const stepServings = useCallback(
    (entry: MealPlanEntryEntity, direction: number) => {
      const next = direction > ValueConstants.zero ? entry.servings.increment() : entry.servings.decrement();
      if (!entry.canChangeServings || next.value === entry.servings.value) return;
      void mealPlanStore.getState().setServings(entry, next).then((result) => {
        if (!result.ok) showErrorToast(result.failure);
      });
    },
    [mealPlanStore],
  );

  const toggleEaten = useCallback(
    async (entry: MealPlanEntryEntity) => {
      const eaten = !entry.eaten;
      const result = await mealPlanStore.getState().setEaten(entry, eaten, today);
      if (!result.ok) {
        showErrorToast(result.failure);
        return;
      }
      void diaryStore.getState().loadDay(entry.date);
      const strings = t().mealPlan;
      showSuccessToast(eaten ? strings.loggedToDiary.replace('{day}', formatPlanDay(entry.date, locale)) : strings.removedFromDiary);
    },
    [diaryStore, locale, mealPlanStore, today],
  );

  const remove = useCallback(
    async (entry: MealPlanEntryEntity) => {
      const result = await mealPlanStore.getState().remove(entry);
      if (!result.ok) {
        showErrorToast(result.failure);
        return;
      }
      toastStore.getState().show({
        severity: SeverityType.Neutral,
        message: t().mealPlan.removed,
        actionLabel: t().mealPlan.undo,
        onAction: () => void mealPlanStore.getState().restore([entry]).then((restored) => (restored.ok ? undefined : showErrorToast(restored.failure))),
      });
    },
    [mealPlanStore],
  );

  const move = useCallback(
    async (entry: MealPlanEntryEntity, date: CalendarDate, meal: MealSlotType) => {
      const result = await mealPlanStore.getState().move(entry, date, meal);
      if (!result.ok) {
        showErrorToast(result.failure);
        return;
      }
      showSuccessToast(t().mealPlan.movedTo.replace('{slot}', planMealLabel(meal)).replace('{day}', formatPlanDay(date, locale)));
    },
    [locale, mealPlanStore],
  );

  return {
    stepServings,
    toggleEaten: (entry) => void toggleEaten(entry),
    remove: (entry) => void remove(entry),
    move: (entry, date, meal) => void move(entry, date, meal),
    openRecipe: useCallback((entry: MealPlanEntryEntity) => router.push(RoutePaths.recipeDetail(entry.recipe.id) as Href), [router]),
  };
};
