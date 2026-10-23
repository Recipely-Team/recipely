import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { PlanView } from '@presentation/app/diary/model/plan/plan-view';
import { toPlanView } from '@presentation/app/diary/model/plan/to-plan-view';

interface MealPlanWeekModel {
  view: PlanView;
  today: CalendarDate;
  /** The Monday of the week shown. */
  weekStart: CalendarDate;
  /** The day the phone layout shows under the strip. */
  selected: CalendarDate;
  isCurrentWeek: boolean;
  /** The diary's calorie goal — what every day's bar is measured against. */
  goal: number;
  isRefreshing: boolean;
  select: (date: CalendarDate) => void;
  /** −1 for the previous week, +1 for the next; the same weekday stays selected. */
  page: (direction: number) => void;
  goToThisWeek: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
}

/**
 * The Plan view's week (design spec → Meal planner): which week and day are
 * shown, the week's state from `mealPlanStore`, and the diary's calorie goal.
 *
 * @remarks
 * - **A week loads the first time it is shown**; a loaded week is shown at
 *   once on the way back and refreshed by pull-to-refresh.
 * - **Signed out, nothing is asked for** — the view is the sign-in card.
 */
export const useMealPlanWeek = (): MealPlanWeekModel => {
  const { authStore, mealPlanStore, diaryStore } = useStores();
  const signedIn = useStore(authStore, (s) => s.state.status === StoreStatus.Authenticated);
  const weekStart = useStore(mealPlanStore, (s) => s.weekStart);
  const state = useStore(mealPlanStore, (s) => s.weeks[s.weekStart.value]);
  const goal = useStore(diaryStore, (s) => s.goals.calories);
  const [today] = useState(() => CalendarDate.today());
  const [selected, setSelected] = useState(() => (weekStart.equals(today.weekStart()) ? today : weekStart));
  const [isRefreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (signedIn && state === undefined) void mealPlanStore.getState().load(weekStart);
  }, [mealPlanStore, signedIn, state, weekStart]);

  useEffect(() => {
    if (signedIn) void diaryStore.getState().loadGoals();
  }, [diaryStore, signedIn]);

  const showWeek = (day: CalendarDate): void => {
    mealPlanStore.getState().showWeek(day);
    setSelected(day);
  };

  return {
    view: toPlanView(signedIn, state),
    today,
    weekStart,
    selected,
    isCurrentWeek: weekStart.equals(today.weekStart()),
    goal,
    isRefreshing,
    select: setSelected,
    page: (direction: number) => showWeek(selected.addDays(direction * MealPlanLimits.daysPerWeek)),
    goToThisWeek: () => showWeek(today),
    refresh: async () => {
      setRefreshing(true);
      await mealPlanStore.getState().load(weekStart);
      setRefreshing(false);
    },
    retry: () => void mealPlanStore.getState().load(weekStart),
  };
};
