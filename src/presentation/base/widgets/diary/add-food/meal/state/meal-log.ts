import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealLogState } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-state';

/** "Describe or photograph your meal" as `useMealLog` exposes it to the panel. */
export interface MealLog {
  state: MealLogState;
  text: string;
  setText: (text: string) => void;
  /** True after the camera or library permission was refused; cleared by the next try. */
  photoDenied: boolean;
  parseText: () => void;
  pickPhoto: () => void;
  /** Sends the failed input again. */
  retry: () => void;
  /** Back to the form, the description kept. */
  edit: () => void;
  toggle: (key: string) => void;
  setGrams: (key: string, text: string) => void;
  selectedCount: number;
  /** Kcal of the ticked rows at their current grams. */
  selectedCalories: number;
  add: (meal: MealSlotType) => Promise<void>;
}
