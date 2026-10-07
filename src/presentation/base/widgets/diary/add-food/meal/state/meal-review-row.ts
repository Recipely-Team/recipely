import type { MealCandidate } from '@domain/diary/meal/meal-candidate';

/**
 * One row of the confirm list: the candidate at its current grams, whether it
 * will be logged, and the grams box's raw text (a cleared box keeps the last
 * good amount instead of logging zero).
 */
export interface MealReviewRow {
  readonly key: string;
  readonly candidate: MealCandidate;
  readonly included: boolean;
  readonly gramsText: string;
}
