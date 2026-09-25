import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CoverRemoval } from '@domain/recipes/publishing/cover-removal';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/** Takes the cover off a recipe the signed-in user owns; the next photo takes its place. */
export class RemoveRecipeCoverUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(recipeId: string): Promise<Result<CoverRemoval, Failure>> {
    return this.repo.removeRecipeCover(recipeId);
  }
}
