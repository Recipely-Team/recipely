import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** Loads the recipes the current user has liked, newest like first. */
export class LoadLikedRecipesUseCase {
  constructor(private readonly repo: LikeRepositoryInterface) {}

  execute(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listLiked();
  }
}
