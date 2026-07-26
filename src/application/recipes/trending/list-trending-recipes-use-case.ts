import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';

/**
 * Fetches the "Trending this week" recipes for the discover rail. The optional
 * `limit` (backend caps it at 1–30) is forwarded to the backend as a query param.
 */
export class ListTrendingRecipesUseCase {
  constructor(private readonly repo: IRecipeRepository) {}

  execute(limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listTrendingRecipes(limit);
  }
}
