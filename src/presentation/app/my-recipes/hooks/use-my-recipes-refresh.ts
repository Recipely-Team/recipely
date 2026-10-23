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
  const { savedRecipesStore, likedRecipesStore, myRecipesStore, draftsStore } = useStores();

  // Only a user pull drives RefreshControl (a programmatic refreshing jumps the iOS scroll).
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The saved grid renders /me/favorites; the store returns its own outcome.
  const refreshSaved = useCallback(async (): Promise<void> => {
    const failure = await savedRecipesStore.getState().loadSaved();
    if (failure !== null) showErrorToast(failure);
  }, [savedRecipesStore]);

  const refreshLiked = useCallback(async (): Promise<void> => {
    const failure = await likedRecipesStore.getState().loadLiked();
    if (failure !== null) showErrorToast(failure);
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
          const failure = await myRecipesStore.getState().loadMine();
          if (failure !== null) showErrorToast(failure);
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
  }, [tab, refreshSaved, refreshLiked, myRecipesStore, draftsStore]);

  return { isRefreshing, onRefresh };
};
