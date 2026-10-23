import { useStores } from '@presentation/bootstrap/use-stores';
import { useStore } from 'zustand';
import type { Failure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import type { PagedList } from '@application/store/paging/paged-list';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

const totalOf = (list: PagedList<RecipeSummaryEntity>): number =>
  list.status === StoreStatus.Loaded ? list.total : ValueConstants.zero;

/**
 * The paging of the Saved, Liked and Created lists: each tab's server total
 * (what its count shows) and the next-page loader the shown list calls at its
 * end. Every list is a `PagedList`, so total and next-page state come from its
 * `ListLoaded` state. Drafts pages through its own store.
 */
export const useMyRecipesPaging = (
  tab: TabType,
): {
  totals: { saved: number; liked: number; created: number };
  /** The shown list's footer: the next-page spinner and why the last next page failed. */
  itemsFooter: { isLoadingMoreItems: boolean; itemsMoreFailure: Failure | null };
  onItemsEndReached: () => void;
} => {
  const { savedRecipesStore, likedRecipesStore, myRecipesStore } = useStores();
  const saved = useStore(savedRecipesStore, (s) => s.saved);
  const liked = useStore(likedRecipesStore, (s) => s.liked);
  const mine = useStore(myRecipesStore, (s) => s.mine);
  const active = tab === TabType.Saved ? saved : tab === TabType.Liked ? liked : tab === TabType.Created ? mine : null;

  const onItemsEndReached = (): void => {
    if (tab === TabType.Saved) void savedRecipesStore.getState().loadMoreSaved();
    else if (tab === TabType.Liked) void likedRecipesStore.getState().loadMoreLiked();
    else if (tab === TabType.Created) void myRecipesStore.getState().loadMoreMine();
  };

  const loaded = active?.status === StoreStatus.Loaded ? active : null;
  const itemsFooter = { isLoadingMoreItems: loaded?.isLoadingMore === true, itemsMoreFailure: loaded?.moreFailure ?? null };

  return { totals: { saved: totalOf(saved), liked: totalOf(liked), created: totalOf(mine) }, itemsFooter, onItemsEndReached };
};
