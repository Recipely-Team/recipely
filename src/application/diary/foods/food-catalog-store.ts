import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import type { FoodCatalogStoreState } from '@application/diary/foods/food-catalog-store-state';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import type { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import type { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import type { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';

interface FoodCatalogStoreDeps {
  listCategories: ListFoodCategoriesUseCase;
  listProducts: ListFoodProductsUseCase;
  listRecent: ListRecentFoodPageUseCase;
  loadDetail: LoadFoodDetailUseCase;
}

/**
 * The Add food sheet's Products and Recent tabs and its product step (Add
 * food v2 spec §2b, §4): shelves, a shelf's products, recent foods — each a
 * backend-paged list — and the opened product's variants.
 *
 * @remarks
 * - **Every list pages on scroll** through its own `PagedListLoader`, whose
 *   generation drops an answer for a shelf the user already left.
 * - **The newest `openProduct` wins**: tapping a second row before the first
 *   answered shows the second.
 * - **User-scoped** (recent): cleared on sign-out.
 */
export const configureFoodCatalogStore = (deps: FoodCatalogStoreDeps): BoundStore<FoodCatalogStoreState> => {
  let detailRequests = ValueConstants.zero;

  return create<FoodCatalogStoreState>((set, get) => {
    const categories = new PagedListLoader<FoodCategory>(() => get().categories, (list) => set({ categories: list }), (c) => c.key);
    const products = new PagedListLoader<FoodProduct>(() => get().products, (list) => set({ products: list }), (p) => p.key);
    const recent = new PagedListLoader<RecentFoodType>(() => get().recent, (list) => set({ recent: list }), (r) => r.key);
    const shelf = (category: string | null): Promise<void> =>
      products.load((page) => deps.listProducts.execute(category, page));

    return {
      categories: { status: StoreStatus.Idle },
      category: null,
      products: { status: StoreStatus.Idle },
      recent: { status: StoreStatus.Idle },
      detail: { status: StoreStatus.Idle },

      loadProducts: async () => {
        await Promise.all([categories.load((page) => deps.listCategories.execute(page)), shelf(get().category)]);
      },
      loadMoreCategories: () => categories.loadMore(),
      selectCategory: async (category) => {
        set({ category });
        await shelf(category);
      },
      loadMoreProducts: () => products.loadMore(),
      loadRecent: () => recent.load((page) => deps.listRecent.execute(page)),
      loadMoreRecent: () => recent.loadMore(),

      openProduct: async (product) => {
        detailRequests += ValueConstants.one;
        const requested = detailRequests;
        const key = product.key;
        set({ detail: { status: StoreStatus.Loading, key } });
        const result = await deps.loadDetail.execute(product);
        if (requested !== detailRequests) return;
        set({
          detail: result.ok
            ? { status: StoreStatus.Loaded, key, detail: result.value }
            : { status: StoreStatus.Error, key, failure: result.failure },
        });
      },
      closeProduct: () => {
        detailRequests += ValueConstants.one;
        set({ detail: { status: StoreStatus.Idle } });
      },

      clear: () => {
        detailRequests += ValueConstants.one;
        categories.reset();
        products.reset();
        recent.reset();
        set({ category: null, detail: { status: StoreStatus.Idle } });
      },
    };
  });
};
