import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';

/**
 * Fetches the paginated list of publicly active recipes for the discovery feed.
 * Optional filters are forwarded to the backend as query params.
 */
export class ListRecipesUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(filters?: RecipeFilters): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listActiveRecipes(filters);
  }
}
