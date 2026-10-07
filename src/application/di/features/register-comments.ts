import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { configureCommentsStore } from '@application/comments/comments-store';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';

/** **Comments composition** — the recipe comment thread store and its use cases. */
export const registerComments = (container: Container): Pick<ApplicationStores, 'commentsStore'> => {
  const commentRepo = container.resolve<CommentRepositoryInterface>(TOKENS.CommentRepository);
  const listCommentsUseCase = new ListCommentsUseCase(commentRepo);
  const addCommentUseCase = new AddCommentUseCase(commentRepo);
  const deleteCommentUseCase = new DeleteCommentUseCase(commentRepo);
  const likeCommentUseCase = new LikeCommentUseCase(commentRepo);
  const unlikeCommentUseCase = new UnlikeCommentUseCase(commentRepo);
  const commentsStore = configureCommentsStore({
    listComments: listCommentsUseCase,
    addComment: addCommentUseCase,
    deleteComment: deleteCommentUseCase,
    likeComment: likeCommentUseCase,
    unlikeComment: unlikeCommentUseCase,
  });
  return { commentsStore };
};
