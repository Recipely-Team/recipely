import type { StoreApi } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';
import { ValueConstants } from '@core/constants';

type SetState = StoreApi<CommentsStoreState>['setState'];

/**
 * Builds the `deleteComment` action: removes a comment and decrements the total
 * on success. Resolves `true` when the comment was deleted.
 */
export const createDeleteCommentAction = (
  set: SetState,
  deleteComment: DeleteCommentUseCase,
) => {
  return async (recipeId: string, commentId: string): Promise<boolean> => {
    try {
      const result = await deleteComment.execute({ recipeId, commentId });
      if (!result.ok) {
        set((state) => ({
          byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
            error: result.failure,
          })),
        }));
        return false;
      }
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, (existing) => ({
          items: existing.items.filter((c) => c.id !== commentId),
          total: Math.max(ValueConstants.zero, existing.total - 1),
          error: null,
        })),
      }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
          error: new UnknownFailure(msg),
        })),
      }));
      return false;
    }
  };
};
