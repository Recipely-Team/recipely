import type { MealMatchKindType } from '@domain/diary/meal/meal-match-kind';

/** What a meal item was matched to; `id` and `name` are null when there is no match. */
export interface MealMatch {
  readonly kind: MealMatchKindType;
  readonly id: string | null;
  readonly name: string | null;
}
