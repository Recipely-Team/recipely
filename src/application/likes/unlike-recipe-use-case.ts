import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';

/** Removes the current user's like from the given recipe. */
export class UnlikeRecipeUseCase {
  constructor(private readonly likes: LikeRepositoryInterface) {}

  execute(recipeId: string): Promise<Result<void, Failure>> {
    return this.likes.unlike(recipeId);
  }
}
