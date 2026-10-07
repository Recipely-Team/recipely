import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { MealMatch } from '@domain/diary/meal/meal-match';

export interface MealCandidateProps {
  readonly label: string;
  /** The amount the user is logging — starts at what the parser guessed. */
  readonly grams: number;
  /** The amount `portion` is for: the parser's guess, kept so every edit rescales from it. */
  readonly portionGrams: number;
  /** Nutrients of `portionGrams`. */
  readonly portion: Nutrients;
  readonly match: MealMatch;
  /** True when the figures are the model's estimate, not the catalogue's. */
  readonly estimated: boolean;
  /** 0..1 — how sure the parser is of the item. */
  readonly confidence: number;
}
