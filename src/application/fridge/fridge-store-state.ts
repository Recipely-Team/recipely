import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';
import type { FridgeAvailabilityType } from '@application/fridge/fridge-availability';

export interface FridgeStoreState {
  /** The `fridgeToRecipe` flag as resolved for this session; entry points render nothing until it is `On`. */
  availability: FridgeAvailabilityType;
  /** Resolves the flag once; later calls are free. */
  checkAvailability: () => Promise<void>;
  /** Photos → ingredients. The flow's state is the screen's own; nothing is kept here. */
  scan: (input: FridgeScanInput) => Promise<Result<readonly FridgeIngredient[], Failure>>;
  /** Ingredients + filters → up to three ideas. */
  suggestIdeas: (input: FridgeIdeasInput) => Promise<Result<readonly FridgeIdea[], Failure>>;
}
