import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';

/** Sets the viewer's like on a comment: `like` true likes it, false removes the like. */
export class SetCommentLikeUseCase {
  constructor(
    private readonly likeComment: LikeCommentUseCase,
    private readonly unlikeComment: UnlikeCommentUseCase,
  ) {}

  execute(recipeId: string, commentId: string, like: boolean): Promise<Result<void, Failure>> {
    return like
      ? this.likeComment.execute(recipeId, commentId)
      : this.unlikeComment.execute(recipeId, commentId);
  }
}
