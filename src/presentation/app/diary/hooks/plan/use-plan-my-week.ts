import { useCallback, useMemo, useState } from 'react';
import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { WeekSuggestion } from '@domain/meal-plan/suggest/week-suggestion';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { formatPlanDay } from '@presentation/app/diary/model/plan/format-plan-day';
import { PlanWeekStep, type PlanWeekStepType } from '@presentation/app/diary/model/plan/plan-week-step';
import type { ProposalRow } from '@presentation/app/diary/model/plan/proposal-row';
import type { UsePlanMyWeekResult } from '@presentation/app/diary/model/plan/use-plan-my-week-result';
import { useLocale, useTranslations } from '@presentation/i18n';

/** The seed range the backend accepts; a new one is "Shuffle". */
const SEED_MAX = 2_147_483_647;
const newSeed = (): number => Math.floor(Math.random() * SEED_MAX);
const keyOf = (date: CalendarDate, meal: MealSlotType): string => `${date.value}|${meal}`;

/**
 * "Plan my week" (prototype: Import Review - Plan My Week board, §2): pick the
 * meals to fill, see a drafted week, swap any meal for its one alternative,
 * shuffle, then add the kept meals as ordinary plan entries, with Undo.
 *
 * @remarks
 * - **Nothing is written until Add.** The draft is this sheet's own state.
 * - **Only today onwards**: a past day of the week is never filled.
 * - **The seed stays until Shuffle**, so reopening shows the same week.
 * - **Undo removes exactly what Add wrote**, entry by entry.
 */
export const usePlanMyWeek = (weekStart: CalendarDate, today: CalendarDate): UsePlanMyWeekResult => {
  const t = useTranslations();
  const { mealPlanStore } = useStores();
  const locale = useLocale();
  const [isVisible, setVisible] = useState(false);
  const [step, setStep] = useState<PlanWeekStepType>(PlanWeekStep.Meals);
  const [meals, setMeals] = useState<ReadonlySet<MealSlotType>>(() => new Set([MealSlot.Dinner]));
  const [seed, setSeed] = useState(newSeed);
  const [suggestion, setSuggestion] = useState<WeekSuggestion | null>(null);
  const [swapped, setSwapped] = useState<ReadonlySet<string>>(() => new Set());
  const [isLoading, setLoading] = useState(false);
  const [isAdding, setAdding] = useState(false);

  const fetchWeek = useCallback(
    async (withSeed: number) => {
      setLoading(true);
      const ordered = Object.values(MealSlot).filter((meal) => meals.has(meal));
      const result = await mealPlanStore.getState().suggestWeek(weekStart, ordered, withSeed);
      setLoading(false);
      if (!result.ok) {
        showErrorToast(result.failure);
        return;
      }
      setSuggestion(result.value);
      setStep(PlanWeekStep.Proposal);
    },
    [mealPlanStore, meals, weekStart],
  );

  const rows: ProposalRow[] = useMemo(
    () =>
      (suggestion?.slots ?? [])
        .filter((slot) => !slot.date.isBefore(today))
        .map((slot) => {
          const key = keyOf(slot.date, slot.meal);
          const isSwapped = swapped.has(key) && slot.alternative !== null;
          return {
            key,
            date: slot.date,
            meal: slot.meal,
            shown: isSwapped ? slot.alternative : slot.pick,
            other: isSwapped ? slot.pick : slot.alternative,
            swapped: isSwapped,
          };
        }),
    [suggestion, swapped, today],
  );

  const days = useMemo(() => {
    const byDay = new Map<string, { date: CalendarDate; rows: ProposalRow[] }>();
    for (const row of rows) {
      const day = byDay.get(row.date.value) ?? { date: row.date, rows: [] };
      byDay.set(row.date.value, { date: day.date, rows: [...day.rows, row] });
    }
    return [...byDay.entries()].map(([key, day]) => ({ key, label: formatPlanDay(day.date, locale), rows: day.rows }));
  }, [rows, locale]);

  const toAdd = rows.filter((row) => row.shown !== null);

  const add = useCallback(async () => {
    setAdding(true);
    const added: MealPlanEntryEntity[] = [];
    for (const row of toAdd) {
      if (row.shown === null) continue;
      const result = await mealPlanStore.getState().add({ date: row.date, meal: row.meal, recipeId: row.shown.id, servings: Servings.one() }, today);
      if (!result.ok) {
        showErrorToast(result.failure);
        break;
      }
      added.push(result.value);
    }
    setAdding(false);
    setVisible(false);
    if (added.length === ValueConstants.zero) return;
    toastStore.getState().show({
      severity: SeverityType.Neutral,
      message: t.mealPlan.planWeek.added.replace('{n}', String(added.length)),
      actionLabel: t.mealPlan.undo,
      onAction: () => void Promise.all(added.map((entry) => mealPlanStore.getState().remove(entry))),
    });
  }, [mealPlanStore, toAdd, today, t]);

  return {
    visible: isVisible,
    step,
    meals,
    loading: isLoading,
    emptyPool: suggestion !== null && suggestion.poolSize === ValueConstants.zero,
    days,
    addCount: toAdd.length,
    adding: isAdding,
    open: () => {
      setStep(PlanWeekStep.Meals);
      setVisible(true);
    },
    close: () => setVisible(false),
    toggleMeal: (meal) =>
      setMeals((current) => {
        const next = new Set(current);
        if (next.has(meal)) next.delete(meal);
        else next.add(meal);
        return next;
      }),
    showPlan: () => void fetchWeek(seed),
    change: () => setStep(PlanWeekStep.Meals),
    shuffle: () => {
      const next = newSeed();
      setSeed(next);
      setSwapped(new Set());
      void fetchWeek(next);
    },
    toggleSwap: (key) =>
      setSwapped((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
    add: () => void add(),
  };
};
