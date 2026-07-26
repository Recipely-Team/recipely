import { useCallback, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';
import type { UseMyRecipesRefreshResult } from '@presentation/app/my-recipes/model/use-my-recipes-refresh-result';

/**
 * Pull-to-refresh for the My-Recipes screen: re-fetches exactly what the active
 * tab renders — the saved tab needs both the favorite ids and the recipe list
 * they filter against, the created and drafts tabs each own a single store load.
 */
export const useMyRecipesRefresh = (tab: TabType): UseMyRecipesRefreshResult => {
  const { recipeListStore, savedRecipesStore, createdRecipesStore, draftsStore, loadFavoritesUseCase } = useStores();
  const loadRecipes = recipeListStore((s) => s.load);

  // WHY: mirrors the recipe feed (`useRecipeList`) — `RefreshControl.refreshing`
  // must reflect ONLY a user-initiated pull. A store's generic refreshing flag
  // would go true on a tab switch too, and a programmatic `refreshing={true}` on
  // iOS calls `UIRefreshControl.beginRefreshing`, animating the scroll view down
  // and back: a visible jump (the bug fixed in PR #161).
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The saved grid is `recipeList.recipes` filtered by `savedIds`, so a refresh
  // that reloaded only one of the two would render a stale intersection.
  const refreshSaved = useCallback(async (): Promise<void> => {
    const [, favorites] = await Promise.all([loadRecipes(), loadFavoritesUseCase.execute()]);
    if (favorites.ok) {
      savedRecipesStore.getState().setSavedIds(favorites.value);
    } else {
      showErrorToast(favorites.failure);
    }
  }, [loadRecipes, loadFavoritesUseCase, savedRecipesStore]);

  const onRefresh = useCallback((): void => {
    setIsRefreshing(true);
    void (async () => {
      try {
        if (tab === 'saved') {
          await refreshSaved();
        } else if (tab === 'created') {
          await createdRecipesStore.getState().loadMyRecipes();
        } else {
          await draftsStore.getState().loadDrafts();
        }
      } catch {
        // The store loads fold failures into their own state and shouldn't
        // reject; swallow anyway so an unexpected throw can't escape as an
        // unhandled rejection.
      } finally {
        // Unconditional clear: never leave the spinner stuck. A late clear after
        // unmount is a harmless no-op, so this needs no mounted-ref guard.
        setIsRefreshing(false);
      }
    })();
  }, [tab, refreshSaved, createdRecipesStore, draftsStore]);

  return { isRefreshing, onRefresh };
};
