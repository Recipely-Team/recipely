import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';

import type { GoalFieldType } from '@presentation/app/diary/model/goal-field';

/** The Daily goals sheet's form, as `useGoalsForm` exposes it. */
export interface GoalsForm {
  values: Readonly<Record<GoalFieldType, string>>;
  setField: (field: GoalFieldType, value: string) => void;
  stepCalories: (direction: number) => void;
  resetToDefaults: () => void;
  /** The goals the fields add up to, or null while a field is empty or out of range. */
  candidate: NutritionGoals | null;
  isSaving: boolean;
  save: () => void;
}
