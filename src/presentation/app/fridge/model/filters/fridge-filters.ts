import type { FridgeDietType } from '@domain/fridge/ideas/fridge-diet';
import type { FridgeMaxMinutesType } from '@domain/fridge/ideas/fridge-max-minutes';

/** The optional filters on the ingredients step; `maxMinutes` null is "Any". */
export interface FridgeFilters {
  readonly maxMinutes: FridgeMaxMinutesType | null;
  readonly diet: FridgeDietType;
  readonly servings: number;
}
