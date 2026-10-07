import type { Failure } from '@core/failure';
import type { MealParseInputType } from '@domain/diary/meal/meal-parse-input';
import type { MealParseNoteType } from '@domain/diary/meal/meal-parse-note';
import type { MealLogPhase } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-phase';
import type { MealReviewRow } from '@presentation/base/widgets/diary/add-food/meal/state/meal-review-row';

/** The meal-log panel's state; `retry` is the input a "Try again" re-sends. */
export type MealLogState =
  | { phase: typeof MealLogPhase.Compose }
  | { phase: typeof MealLogPhase.Parsing }
  | { phase: typeof MealLogPhase.Failed; failure: Failure; retry: MealParseInputType }
  | { phase: typeof MealLogPhase.Review; rows: readonly MealReviewRow[]; note: MealParseNoteType | null };
