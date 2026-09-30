import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { MealSlotType } from '@domain/diary/meal-slot';

/** The Quick add tab's fields and what they add up to, as `useQuickAddForm` exposes them. */
export interface QuickAddForm {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  meal: MealSlotType;
  setName: (value: string) => void;
  setCalories: (value: string) => void;
  setProtein: (value: string) => void;
  setCarbs: (value: string) => void;
  setFat: (value: string) => void;
  setMeal: (meal: MealSlotType) => void;
  /** Kcal the typed macros account for at 4 / 4 / 9; null until a macro is typed. */
  macroCalories: number | null;
  /** The food to log, or null while the name is empty or the kcal are not above zero. */
  food: LoggableFood | null;
}
