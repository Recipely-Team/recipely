import type { StoreApi } from 'zustand';
import { UnknownFailure } from '@core/failure';
import { COMMENTS_PAGE_SIZE } from '@infrastructure/constants/api';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import { defaultRecipeCommentsState } from '@application/comments/list/default-recipe-comments-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';

/** Builds the `loadMore` action: appends the next page of a recipe's comments. */
export const createLoadMoreCommentsAction = (
  set: StoreApi<CommentsStoreState>['setState'],
  get: StoreApi<CommentsStoreState>['getState'],
  listComments: ListCommentsUseCase,
) => {
  return async (recipeId: string): Promise<void> => {
    const current = get().byRecipe[recipeId] ?? defaultRecipeCommentsState();
    if (current.isLoadingMore || current.items.length >= current.total) {
      return;
    }

    const nextPage = current.page + 1; // TO DO: 1 constants dosyasına taşınabilir.
    set((state) => ({
      byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
        isLoadingMore: true,
        error: null,
      })),
    }));

    try {
      const result = await listComments.execute({ recipeId, page: nextPage, pageSize: COMMENTS_PAGE_SIZE });
      if (!result.ok) {
        set((state) => ({
          byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
            isLoadingMore: false,
            error: result.failure,
          })),
        }));
        return;
      }
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, (existing) => ({
          items: [...existing.items, ...result.value.items],
          total: result.value.total,
          page: nextPage,
          isLoadingMore: false,
          error: null,
        })),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => ({
        byRecipe: mergeRecipeComments(state.byRecipe, recipeId, () => ({
          isLoadingMore: false,
          error: new UnknownFailure(msg),
        })),
      }));
    }
  };
};
