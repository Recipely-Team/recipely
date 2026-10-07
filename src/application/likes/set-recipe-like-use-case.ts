import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';

/** Likes (`true`) or unlikes (`false`) a recipe on behalf of the current user. */
export class SetRecipeLikeUseCase {
  constructor(private readonly likes: LikeRepositoryInterface) {}

  execute(recipeId: string, like: boolean): Promise<Result<void, Failure>> {
    return like ? this.likes.like(recipeId) : this.likes.unlike(recipeId);
  }
}
