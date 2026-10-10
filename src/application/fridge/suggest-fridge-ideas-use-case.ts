import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, ValidationFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import { ValueConstants } from '@core/constants';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgeRepositoryInterface } from '@domain/fridge/fridge-repository-interface';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';
import { normalizeFridgeIngredients } from '@domain/fridge/normalize-fridge-ingredients';

const clampServings = (servings: number): number =>
  Math.min(FridgeLimits.servingsMax, Math.max(FridgeLimits.servingsMin, Math.round(servings)));

/**
 * Asks for up to three recipe ideas from the user's ingredients and filters.
 *
 * @remarks
 * - **The request is made valid here, not refused**: names are normalised
 *   (`normalizeFridgeIngredients`), servings clamped to 1–12 and `exclude` cut
 *   to the most recent `FridgeLimits.excludeMax` titles — every bound the
 *   server would otherwise answer with `ingredients_invalid` / `options_invalid`.
 * - **An empty list is the one thing that cannot be fixed** and is refused
 *   with the server's key, `ingredients_required`, before any AI call is spent.
 */
export class SuggestFridgeIdeasUseCase {
  constructor(private readonly repo: FridgeRepositoryInterface) {}

  execute(input: FridgeIdeasInput): Promise<Result<readonly FridgeIdea[], Failure>> {
    const ingredients = normalizeFridgeIngredients(input.ingredients);
    if (ingredients.length === ValueConstants.zero) {
      return Promise.resolve(
        fail(new ValidationFailure(DiagnosticMessage.fridge.ingredientsRequired, 'ingredients', ErrorMessageKey.fridgeIngredientsRequired)),
      );
    }
    const exclude = input.exclude
      .filter((title) => !isBlank(title))
      .map((title) => title.trim().slice(ValueConstants.zero, FridgeLimits.excludeTitleMax))
      .slice(-FridgeLimits.excludeMax);
    return this.repo.suggestIdeas({ ...input, ingredients, servings: clampServings(input.servings), exclude });
  }
}
