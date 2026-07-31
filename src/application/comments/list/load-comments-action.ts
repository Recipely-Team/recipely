import type { StoreApi } from 'zustand';
import { UnknownFailure } from '@core/failure';
import { COMMENTS_PAGE_SIZE } from '@infrastructure/constants/api';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';

type SetState = StoreApi<CommentsStoreState>['setState'];

/** Builds the `load` action: fetches the first page of a recipe's comments. */
export const createLoadCommentsAction = (
  set: SetState,
  listComments: ListCommentsUseCase,
) => {
  return async (recipeId: string): Promise<void> => {
    set((state) => ({
      byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
        isLoading: true,
        error: null,
      })),
    }));

    try {
      const result = await listComments.execute({ recipeId, page: 1, pageSize: COMMENTS_PAGE_SIZE });
      if (!result.ok) {
        set((state) => ({
          byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
            isLoading: false,
            error: result.failure,
          })),
        }));
        return;
      }
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
          items: result.value.items,
          total: result.value.total,
          page: 1,
          isLoading: false,
          error: null,
        })),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
          isLoading: false,
          error: new UnknownFailure(msg),
        })),
      }));
    }
  };
};
