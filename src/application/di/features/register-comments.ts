import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { SetCommentLikeUseCase } from '@application/comments/like/set-comment-like-use-case';
import { configureCommentsStore } from '@application/comments/comments-store';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';

/** **Comments composition** — the recipe comment thread store and its use cases. */
export const registerComments = (container: Container): Pick<ApplicationStores, 'commentsStore'> => {
  const commentRepo = container.resolve<CommentRepositoryInterface>(TOKENS.CommentRepository);
  const commentsStore = configureCommentsStore({
    listComments: new ListCommentsUseCase(commentRepo),
    addComment: new AddCommentUseCase(commentRepo),
    deleteComment: new DeleteCommentUseCase(commentRepo),
    setCommentLike: new SetCommentLikeUseCase(
      new LikeCommentUseCase(commentRepo),
      new UnlikeCommentUseCase(commentRepo),
    ),
  });
  return { commentsStore };
};
