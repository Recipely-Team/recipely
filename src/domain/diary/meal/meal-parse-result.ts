import type { MealCandidate } from '@domain/diary/meal/meal-candidate';
import type { MealParseNoteType } from '@domain/diary/meal/meal-parse-note';

/** What the meal parser found: up to twelve candidates and an optional note. */
export interface MealParseResult {
  readonly items: readonly MealCandidate[];
  readonly note: MealParseNoteType | null;
}
