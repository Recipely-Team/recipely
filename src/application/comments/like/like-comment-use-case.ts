import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';

/** Sends a like for the given comment on behalf of the current user. */
export class LikeCommentUseCase {
  constructor(private readonly comments: CommentRepositoryInterface) {}

  execute(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    return this.comments.like(recipeId, commentId);
  }
}
