import type { FridgeDietType } from '@domain/fridge/ideas/fridge-diet';
import type { FridgeMaxMinutesType } from '@domain/fridge/ideas/fridge-max-minutes';

/**
 * One ideas request. `maxMinutes` null asks for any time; `exclude` holds the
 * titles already shown, so "Show 3 more" brings new ones.
 */
export interface FridgeIdeasInput {
  readonly ingredients: readonly string[];
  readonly maxMinutes: FridgeMaxMinutesType | null;
  readonly diet: FridgeDietType;
  readonly servings: number;
  readonly exclude: readonly string[];
  readonly locale: string | null;
}
