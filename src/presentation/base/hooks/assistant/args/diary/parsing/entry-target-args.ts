import type { MealSlotType } from '@domain/diary/meal-slot';

/** Which logged entry `removeFood` / `changeFood` mean, and — for a change — what to change. */
export interface EntryTargetArgs {
  name: string;
  /** Narrows the match to one meal. */
  meal: MealSlotType | null;
  servings: number | null;
  toMeal: MealSlotType | null;
}
