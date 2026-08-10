import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import { createLoadCommentsAction } from '@application/comments/list/load-comments-action';
import { createLoadMoreCommentsAction } from '@application/comments/list/load-more-comments-action';
import { createAddCommentAction } from '@application/comments/add/add-comment-action';
import { createDeleteCommentAction } from '@application/comments/delete/delete-comment-action';
import { createToggleLikeAction } from '@application/comments/like/toggle-like-action';

import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';

interface CommentsStoreDeps {
  listComments: ListCommentsUseCase;
  addComment: AddCommentUseCase;
  deleteComment: DeleteCommentUseCase;
  likeComment: LikeCommentUseCase;
  unlikeComment: UnlikeCommentUseCase;
}

/**
 * Assembles the comments store from its per-action factories. State is keyed by
 * recipe id so many recipes' comment threads coexist without interference.
 */
export const configureCommentsStore = (deps: CommentsStoreDeps): BoundStore<CommentsStoreState> => {
  const { listComments, addComment, deleteComment, likeComment, unlikeComment } = deps;

  return create<CommentsStoreState>((set, get) => ({
    byRecipe: {},
    load: createLoadCommentsAction(set, listComments),
    loadMore: createLoadMoreCommentsAction(set, get, listComments),
    addComment: createAddCommentAction(set, addComment),
    deleteComment: createDeleteCommentAction(set, deleteComment),
    toggleLike: createToggleLikeAction(set, get, likeComment, unlikeComment),
    clear: () => set({ byRecipe: {} }),
  }));
};
