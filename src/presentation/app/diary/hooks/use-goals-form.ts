import { useCallback, useState } from 'react';
import { DiaryLimits } from '@domain/diary/diary-limits';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { parseDecimalInput } from '@presentation/base/utils/diary/parse-decimal-input';
import { GOAL_CALORIE_STEP } from '@presentation/app/diary/model/goal-calorie-step';
import type { GoalField } from '@presentation/app/diary/model/goal-field';
import type { GoalsForm } from '@presentation/app/diary/model/goals-form';
import { t } from '@presentation/i18n';

const toFields = (goals: NutritionGoals): Record<GoalField, string> => ({
  calories: String(goals.calories),
  protein: String(goals.protein),
  carbs: String(goals.carbs),
  fat: String(goals.fat),
  fiber: String(goals.fiber),
});

/**
 * The Daily goals sheet's form (design spec → Food Diary §7).
 *
 * @remarks
 * - **Starts from the saved goals every time the sheet opens** — reset while
 *   rendering when `visible` turns true, so no stale edit is shown.
 * - **The domain validates.** The fields become a `NutritionGoals` through
 *   `create`; while that refuses them the hint is hidden and Save disabled.
 *   Water is not on this sheet, so the saved glasses ride along.
 */
export const useGoalsForm = (visible: boolean, onSaved: () => void): GoalsForm => {
  const { diaryStore } = useStores();
  const goals = diaryStore((s) => s.goals);
  const [values, setValues] = useState(() => toFields(goals));
  const [wasVisible, setWasVisible] = useState(visible);
  const [isSaving, setSaving] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValues(toFields(goals));
  }

  const numbers = Object.fromEntries(Object.entries(values).map(([key, text]) => [key, parseDecimalInput(text)])) as Record<GoalField, number | null>;
  const complete = Object.values(numbers).every((value) => value !== null);
  const built = complete
    ? NutritionGoals.create({
        calories: numbers.calories ?? ValueConstants.zero,
        protein: numbers.protein ?? ValueConstants.zero,
        carbs: numbers.carbs ?? ValueConstants.zero,
        fat: numbers.fat ?? ValueConstants.zero,
        fiber: numbers.fiber ?? ValueConstants.zero,
        waterGlasses: goals.waterGlasses,
      })
    : null;
  const candidate = built?.ok === true ? built.value : null;

  const setField = useCallback((field: GoalField, value: string) => setValues((v) => ({ ...v, [field]: value })), []);

  const stepCalories = useCallback((direction: number) => {
    setValues((v) => {
      const current = parseDecimalInput(v.calories) ?? DiaryLimits.GoalCaloriesMin;
      const next = Math.min(DiaryLimits.GoalCaloriesMax, Math.max(DiaryLimits.GoalCaloriesMin, current + direction * GOAL_CALORIE_STEP));
      return { ...v, calories: String(Math.round(next)) };
    });
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (candidate === null) return;
    setSaving(true);
    const result = await diaryStore.getState().saveGoals(candidate);
    setSaving(false);
    if (!result.ok) return void showErrorToast(result.failure);
    onSaved();
    showSuccessToast(t().diary.goalsSaved);
  }, [candidate, diaryStore, onSaved]);

  return {
    values,
    setField,
    stepCalories,
    resetToDefaults: () => setValues(toFields(NutritionGoals.defaults())),
    candidate,
    isSaving,
    save: () => void save(),
  };
};
