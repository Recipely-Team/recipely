import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';

/**
 * **Cook from my fridge** (`/fridge`) — photos → ingredients → recipe ideas.
 * Both calls count against the same daily AI allowance on the server.
 */
export interface FridgeRepositoryInterface {
  /** The ingredients seen in 1–3 photos (multipart). */
  scan(input: FridgeScanInput): Promise<Result<readonly FridgeIngredient[], Failure>>;
  /** Up to three ideas for the ingredients; fewer when the filters leave less. */
  suggestIdeas(input: FridgeIdeasInput): Promise<Result<readonly FridgeIdea[], Failure>>;
}
