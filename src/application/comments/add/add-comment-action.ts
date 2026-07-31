import type { StoreApi } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';

type SetState = StoreApi<CommentsStoreState>['setState'];

/**
 * Builds the `addComment` action: submits a new comment and prepends it to the
 * recipe's list on success. Resolves `true` when the comment was created.
 */
export const createAddCommentAction = (
  set: SetState,
  addComment: AddCommentUseCase,
) => {
  return async (recipeId: string, body: string): Promise<boolean> => {
    set((state) => ({
      byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
        isSubmitting: true,
        error: null,
      })),
    }));

    try {
      const result = await addComment.execute({ recipeId, body });
      if (!result.ok) {
        set((state) => ({
          byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
            isSubmitting: false,
            error: result.failure,
          })),
        }));
        return false;
      }
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, (existing) => ({
          items: [result.value, ...existing.items],
          total: existing.total + 1,
          isSubmitting: false,
          error: null,
        })),
      }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
          isSubmitting: false,
          error: new UnknownFailure(msg),
        })),
      }));
      return false;
    }
  };
};
