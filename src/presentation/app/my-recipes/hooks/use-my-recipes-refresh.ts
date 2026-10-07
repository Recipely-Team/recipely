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

  // Only a user pull drives RefreshControl (a programmatic refreshing jumps the iOS scroll).
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The saved grid renders /me/favorites; the store returns its own outcome.
  const refreshSaved = useCallback(async (): Promise<void> => {
    const result = await savedRecipesStore.getState().loadSaved();
    if (!result.ok) showErrorToast(result.failure);
  }, [savedRecipesStore]);

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
          const failure = await draftsStore.getState().loadDrafts();
          if (failure !== null) showErrorToast(failure);
        }
      } catch {
        // Loads fold failures into state; swallow an unexpected throw anyway.
      } finally {
        setIsRefreshing(false);
      }
    })();
  }, [tab, refreshSaved, refreshLiked, createdRecipesStore, draftsStore]);

  return { isRefreshing, onRefresh };
};
