import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * Fetches the list of recipes created by the currently authenticated user.
 */
export class ListMyRecipesUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(): Promise<Result<Page<RecipeSummaryEntity>, Failure>> {
    return this.repo.listMyRecipes();
  }
}
