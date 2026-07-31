import type { StoreApi } from 'zustand';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentEntity } from '@domain/comments/comment-entity';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';

/**
 * Builds the `toggleLike` action: flips a comment's like optimistically and
 * rolls back on failure. Returns the `Result` so the caller can surface a toast
 * when the toggle is rejected.
 */
export const createToggleLikeAction = (
  set: StoreApi<CommentsStoreState>['setState'],
  get: StoreApi<CommentsStoreState>['getState'],
  likeComment: LikeCommentUseCase,
  unlikeComment: UnlikeCommentUseCase,
) => {
  return async (recipeId: string, commentId: string): Promise<Result<void, Failure>> => {
    const existing = get().byRecipe[recipeId];
    const original = existing?.items.find((c) => c.id === commentId);
    if (!existing || !original) {
      return ok(undefined);
    }

    const wasLiked = original.likedByMe;
    const optimistic = original.withLikeToggled();

    const replace = (target: CommentEntity): void =>
      set((state) => {
        const current = state.byRecipe[recipeId];
        if (!current) {
          return {};
        }
        return {
          byRecipe: {
            ...state.byRecipe,
            [recipeId]: {
              ...current,
              items: current.items.map((c) => (c.id === commentId ? target : c)),
            },
          },
        };
      });

    replace(optimistic);

    const result = wasLiked
      ? await unlikeComment.execute(recipeId, commentId)
      : await likeComment.execute(recipeId, commentId);

    if (!result.ok) {
      replace(original); // rollback
    }

    return result;
  };
};
