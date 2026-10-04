import type { MealSlotType } from '@domain/diary/meal-slot';
import type { NutrientValues } from '@domain/diary/nutrition/nutrient-values';

/** `logFood`'s arg once parsed. Nothing here is validated against the domain yet — that is the handler's step. */
export interface LogFoodArgs {
  /** Null on Recipe Detail when the arg names nothing: the open recipe. */
  name: string | null;
  meal: MealSlotType | null;
  servings: number | null;
  /** As sent (`YYYY-MM-DD`, `today`, `yesterday`); null → the selected day. */
  date: string | null;
  /** Per serving; null unless `calories` was sent (the no-match quick add). */
  perServing: NutrientValues | null;
}
