import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';
import type { AddToPlanRequest } from '@presentation/base/widgets/meal-plan/model/add-to-plan-request';
import type { PlanRecipeChoice } from '@presentation/base/widgets/meal-plan/model/plan-recipe-choice';
import { t, useLocale } from '@presentation/i18n';

interface AddToPlanSheetModel {
  today: CalendarDate;
  recipe: PlanRecipeChoice | null;
  /** From a recipe page: no picker, no "Change". */
  isLocked: boolean;
  date: CalendarDate;
  /** The Monday of the week the day picker shows. */
  pickerWeek: CalendarDate;
  meal: MealSlotType;
  servings: Servings;
  /** Null when the recipe has no calories. */
  totalCalories: number | null;
  isSubmitting: boolean;
  choose: (recipe: PlanRecipeChoice) => void;
  change: () => void;
  setDate: (date: CalendarDate) => void;
  pageWeek: (direction: number) => void;
  setMeal: (meal: MealSlotType) => void;
  increment: () => void;
  decrement: () => void;
  submit: () => Promise<void>;
}

/**
 * The add-to-plan sheet's flow (design spec → Meal planner, Add — pick / details).
 *
 * @remarks
 * - **Each request starts afresh**: its recipe (locked from a recipe page),
 *   its day — never one that has passed — and its meal, else the meal the
 *   recipe's category suggests, else Dinner; one serving.
 * - **Servings step like the diary's** (`Servings`: 0.5 steps, 0.5–20).
 * - **One add at a time**: a second tap while the first is in flight is dropped.
 * - The success toast names the slot and day and, given `onView`, offers a
 *   way to the plan.
 */
export const useAddToPlanSheet = (request: AddToPlanRequest | null, onClose: () => void, onView: (() => void) | undefined): AddToPlanSheetModel => {
  const { mealPlanStore } = useStores();
  const locale = useLocale();
  const [today] = useState(() => CalendarDate.today());
  const [recipe, setRecipe] = useState<PlanRecipeChoice | null>(null);
  const [date, setDate] = useState(today);
  const [pickerWeek, setPickerWeek] = useState(today.weekStart());
  const [meal, setMeal] = useState<MealSlotType>(MealSlot.Dinner);
  const [servings, setServings] = useState(Servings.one());
  const [isSubmitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (request === null) return;
    const start = request.date.isBefore(today) ? today : request.date;
    setRecipe(request.recipe);
    setDate(start);
    setPickerWeek(start.weekStart());
    setMeal(request.meal ?? request.recipe?.meal ?? MealSlot.Dinner);
    setServings(Servings.one());
  }, [request, today]);

  const choose = useCallback(
    (choice: PlanRecipeChoice) => {
      setRecipe(choice);
      if (request?.meal === null && choice.meal !== null) setMeal(choice.meal);
    },
    [request],
  );

  const submit = useCallback(async () => {
    if (recipe === null || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    const result = await mealPlanStore.getState().add({ date, meal, recipeId: recipe.id, servings }, today);
    inFlight.current = false;
    setSubmitting(false);
    if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
    const message = t().mealPlan.addedTo.replace('{slot}', planMealLabel(meal)).replace('{day}', formatPlanDay(date, locale));
    showSuccessToast(message, onView === undefined ? undefined : { label: t().mealPlan.view, onRetry: onView });
    onClose();
  }, [date, locale, meal, mealPlanStore, onClose, onView, recipe, servings, today]);

  return {
    today,
    recipe,
    isLocked: request?.recipe != null,
    date,
    pickerWeek,
    meal,
    servings,
    totalCalories: recipe?.caloriesPerServing == null ? null : Math.round(recipe.caloriesPerServing * servings.value),
    isSubmitting,
    choose,
    change: useCallback(() => setRecipe(null), []),
    setDate,
    pageWeek: useCallback((direction: number) => setPickerWeek((week) => week.addDays(direction * MealPlanLimits.daysPerWeek)), []),
    setMeal,
    increment: useCallback(() => setServings((value) => value.increment()), []),
    decrement: useCallback(() => setServings((value) => value.decrement()), []),
    submit,
  };
};
