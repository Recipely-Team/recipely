import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDetail } from '@domain/recipes/recipe-detail';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Fetches a single recipe by its unique identifier.
 */
export class GetRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string): Promise<Result<RecipeDetail, Failure>> {
    return this.repo.getRecipe(id);
  }
}
