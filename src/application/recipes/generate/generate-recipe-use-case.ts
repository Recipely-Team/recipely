import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';
import type { GenerateRecipeInput } from '@application/recipes/generate/generate-recipe-input';
import { ValueConstants } from '@core/constants';

/**
 * Generates a recipe from a free-text AI prompt. Returns a `ValidationFailure`
 * keyed `errors.validation.prompt_required` immediately when the prompt is
 * blank, without hitting the network — the same key the backend raises for the
 * same rule, so presentation resolves one piece of copy for both.
 */
export class GenerateRecipeUseCase {
  constructor(private readonly repo: IRecipeRepository) {}

  execute(input: GenerateRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    const trimmed = input.prompt.trim();
    if (trimmed.length === ValueConstants.zero) {
      return Promise.resolve(
        fail(new ValidationFailure('Prompt is required', undefined, ErrorMessageKey.promptRequired)),
      );
    }
    return this.repo.generateRecipe(trimmed);
  }
}
