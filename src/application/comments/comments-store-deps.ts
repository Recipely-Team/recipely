import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';

export interface CommentsStoreDeps {
  listComments: ListCommentsUseCase;
  addComment: AddCommentUseCase;
  deleteComment: DeleteCommentUseCase;
  likeComment: LikeCommentUseCase;
  unlikeComment: UnlikeCommentUseCase;
}
