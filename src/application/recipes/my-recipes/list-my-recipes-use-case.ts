import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { RecipePage } from '@domain/recipes/list/recipe-page';

/**
 * Fetches the list of recipes created by the currently authenticated user.
 */
export class ListMyRecipesUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(): Promise<Result<RecipePage, Failure>> {
    return this.repo.listMyRecipes();
  }
}
