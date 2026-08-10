import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';

/** Sends a like for the given recipe on behalf of the current user. */
export class LikeRecipeUseCase {
  constructor(private readonly likes: LikeRepositoryInterface) {}

  execute(recipeId: string): Promise<Result<void, Failure>> {
    return this.likes.like(recipeId);
  }
}
