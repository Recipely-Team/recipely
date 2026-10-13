import { useCallback } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { ListPaging } from '@application/store/paging/list-paging';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

/**
 * The paging of the Saved, Liked and Created lists: each tab's server total
 * (what its count shows) and the next-page loader the shown list calls at its
 * end. Drafts pages through its own store.
 */
export const useMyRecipesPaging = (
  tab: TabType,
): {
  savedPaging: ListPaging;
  likedPaging: ListPaging;
  createdPaging: ListPaging;
  activePaging: ListPaging | null;
  onItemsEndReached: () => void;
} => {
  const { savedRecipesStore, likedRecipesStore, createdRecipesStore } = useStores();
  const savedPaging = savedRecipesStore((s) => s.paging);
  const likedPaging = likedRecipesStore((s) => s.paging);
  const createdPaging = createdRecipesStore((s) => s.myRecipesPaging);
  const activePaging =
    tab === TabType.Saved ? savedPaging : tab === TabType.Liked ? likedPaging : tab === TabType.Created ? createdPaging : null;

  const onItemsEndReached = useCallback((): void => {
    if (tab === TabType.Saved) void savedRecipesStore.getState().loadMoreSaved();
    else if (tab === TabType.Liked) void likedRecipesStore.getState().loadMoreLiked();
    else if (tab === TabType.Created) void createdRecipesStore.getState().loadMoreMyRecipes();
  }, [tab, savedRecipesStore, likedRecipesStore, createdRecipesStore]);

  return { savedPaging, likedPaging, createdPaging, activePaging, onItemsEndReached };
};
