import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/** Takes one photo back off a recipe the signed-in user owns. */
export class RemoveRecipePhotoUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(recipeId: string, mediaId: string): Promise<Result<void, Failure>> {
    return this.repo.removeRecipePhoto(recipeId, mediaId);
  }
}
