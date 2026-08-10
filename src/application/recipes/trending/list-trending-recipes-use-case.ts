import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Fetches the "Trending this week" recipes for the discover rail. The optional
 * `limit` (backend caps it at 1–30) is forwarded to the backend as a query param.
 */
export class ListTrendingRecipesUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(limit?: number): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listTrendingRecipes(limit);
  }
}
