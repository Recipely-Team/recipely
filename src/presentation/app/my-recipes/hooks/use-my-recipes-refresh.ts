import { useCallback, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

/** View model returned by `useMyRecipesRefresh` for the My-Recipes tab bodies. */
interface UseMyRecipesRefreshResult {
  /**
   * True only while a user-initiated pull is in flight — safe to bind straight
   * to `RefreshControl.refreshing`.
   */
  isRefreshing: boolean;
  /** Re-fetches whatever the active tab renders. */
  onRefresh: () => void;
}

/**
 * Pull-to-refresh for the My-Recipes screen: re-fetches exactly what the active
 * tab renders. Each of the four tabs owns one store load, and only the active
 * tab's runs — pulling on Drafts must not re-request the saved and liked grids.
 */
export const useMyRecipesRefresh = (tab: TabType): UseMyRecipesRefreshResult => {
  const { savedRecipesStore, likedRecipesStore, createdRecipesStore, draftsStore } = useStores();

  // WHY: mirrors the recipe feed (`useRecipeList`) — `RefreshControl.refreshing`
  // must reflect ONLY a user-initiated pull. A store's generic refreshing flag
  // would go true on a tab switch too, and a programmatic `refreshing={true}` on
  // iOS calls `UIRefreshControl.beginRefreshing`, animating the scroll view down
  // and back: a visible jump (the bug fixed in PR #161).
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The saved grid renders the favourites response directly, so this is the one
  // request it needs — it no longer borrows rows from the discover feed. The
  // load itself lives in the store (it owns the status the skeleton reads), and
  // hands its own outcome back — reading the shared `listState` instead would
  // toast the wrong answer whenever the focus load and a pull overlap.
  const refreshSaved = useCallback(async (): Promise<void> => {
    const result = await savedRecipesStore.getState().loadSaved();
    if (!result.ok) showErrorToast(result.failure);
  }, [savedRecipesStore]);

  // Same reasoning as `refreshSaved`: the liked grid renders the /me/likes
  // response, and the store hands its own outcome back so overlapping loads
  // cannot toast each other's answer.
  const refreshLiked = useCallback(async (): Promise<void> => {
    const result = await likedRecipesStore.getState().loadLiked();
    if (!result.ok) showErrorToast(result.failure);
  }, [likedRecipesStore]);

  const onRefresh = useCallback((): void => {
    setIsRefreshing(true);
    void (async () => {
      try {
        if (tab === TabType.Saved) {
          await refreshSaved();
        } else if (tab === TabType.Liked) {
          await refreshLiked();
        } else if (tab === TabType.Created) {
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
  }, [tab, refreshSaved, refreshLiked, createdRecipesStore, draftsStore]);

  return { isRefreshing, onRefresh };
};
