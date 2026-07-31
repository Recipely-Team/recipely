import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';

/** Removes the current user's like from the given comment. */
export class UnlikeCommentUseCase {
  constructor(private readonly comments: CommentRepositoryInterface) {}

  execute(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    return this.comments.unlike(recipeId, commentId);
  }
}
