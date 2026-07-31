import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Permanently deletes a recipe owned by the currently authenticated user.
 */
export class DeleteRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.deleteRecipe(id);
  }
}
