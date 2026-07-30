import { create } from 'zustand';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { CommentsStoreDeps } from '@application/comments/comments-store-deps';
import type { CommentsStore } from '@application/comments/comments-store';
import { createLoadCommentsAction } from '@application/comments/list/create-load-comments-action';
import { createLoadMoreCommentsAction } from '@application/comments/list/create-load-more-comments-action';
import { createAddCommentAction } from '@application/comments/add/create-add-comment-action';
import { createDeleteCommentAction } from '@application/comments/delete/create-delete-comment-action';
import { createToggleLikeAction } from '@application/comments/like/create-toggle-like-action';

/**
 * Assembles the comments store from its per-action factories. State is keyed by
 * recipe id so many recipes' comment threads coexist without interference.
 */
export const configureCommentsStore = (deps: CommentsStoreDeps): CommentsStore => {
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
