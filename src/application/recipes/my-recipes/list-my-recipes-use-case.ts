import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';

/**
 * Fetches the list of recipes created by the currently authenticated user.
 */
export class ListMyRecipesUseCase {
  constructor(private readonly repo: IRecipeRepository) {}

  execute(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listMyRecipes();
  }
}
