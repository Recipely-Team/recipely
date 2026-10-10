import type { FridgeConfidenceType } from '@domain/fridge/scan/fridge-confidence';

/** One ingredient the scan saw (or the user typed): its name in the user's language, and how sure it is. */
export interface FridgeIngredient {
  readonly name: string;
  readonly confidence: FridgeConfidenceType;
}
