import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PublishOutcome } from '@domain/recipes/publishing/publish-outcome';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/** Takes a published or in-review recipe back to private. */
export class UnpublishRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string): Promise<Result<PublishOutcome, Failure>> {
    return this.repo.unpublishRecipe(id);
  }
}
