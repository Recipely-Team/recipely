import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { LikedRecipesStore } from '@application/recipes/liked/liked-recipes-store-contract';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

interface LikedRecipesStoreDeps {
  loadLikedRecipesUseCase: LoadLikedRecipesUseCase;
}

/**
 * The viewer's liked recipes, one `PagedList` driven by `PagedListLoader`
 * (see `configureSavedRecipesStore` for why). `clear()` resets the loader, so
 * a load from the previous session cannot put its rows back.
 */
export const configureLikedRecipesStore = (deps: LikedRecipesStoreDeps): BoundStore<LikedRecipesStore> =>
  create<LikedRecipesStore>((set, get) => {
    const loader = new PagedListLoader<RecipeSummaryEntity>(() => get().liked, (liked) => set({ liked }), (r) => r.id);
    const fetchPage = (page: number) => deps.loadLikedRecipesUseCase.execute(page);
    return {
      liked: { status: StoreStatus.Idle },
      removeLocal: (id) => loader.removeItem(id),
      loadLiked: () => loader.refresh(fetchPage),
      loadMoreLiked: () => loader.loadMore(),
      clear: () => loader.reset(),
    };
  });
