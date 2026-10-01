import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { ok } from '@core/result/result-helpers';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { FOOD_SEARCH_PAGE_SIZE } from '@infrastructure/constants/api/api-paging';
import type { FoodSearchStoreState } from '@application/diary/foods/food-search-store-state';
import { PagedListLoader } from '@application/diary/foods/paging/paged-list-loader';
import type { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import type { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import type { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';

interface FoodSearchStoreDeps {
  searchFoods: SearchFoodsUseCase;
  searchRecipeGroup: SearchRecipeGroupUseCase;
  searchProducts: SearchProductsUseCase;
}

const hitKey = (hit: RecipeFoodHit): string => hit.key;
const productKey = (product: FoodProduct): string => product.key;

/**
 * The Add food sheet's server-side search (Add food v2 spec §3): four groups,
 * each paged on its own.
 *
 * @remarks
 * - **One request for every first page.** A query fetches all four groups'
 *   first pages at once; each group's later pages go through `group=`.
 * - **An empty query is the Recipes tab**: saved, mine and recipes are listed
 *   unfiltered, one request per group; products stay idle.
 * - **Stale answers never land.** Each group's `PagedListLoader` drops an
 *   answer begun before the latest `search`, so an older query's slow
 *   response cannot replace a newer one — first page or next page.
 * - **User-scoped** (saved / mine): cleared on sign-out.
 */
export const configureFoodSearchStore = (deps: FoodSearchStoreDeps): BoundStore<FoodSearchStoreState> =>
  create<FoodSearchStoreState>((set, get) => {
    const recipeLoader = (group: RecipeHitGroupType): PagedListLoader<RecipeFoodHit> =>
      new PagedListLoader(() => get()[group], (list) => set({ [group]: list }), hitKey);
    const loaders = {
      saved: recipeLoader(FoodSearchGroup.Saved),
      mine: recipeLoader(FoodSearchGroup.Mine),
      recipes: recipeLoader(FoodSearchGroup.Recipes),
      products: new PagedListLoader<FoodProduct>(() => get().products, (list) => set({ products: list }), productKey),
    };
    const recipeGroups: readonly RecipeHitGroupType[] = [FoodSearchGroup.Saved, FoodSearchGroup.Mine, FoodSearchGroup.Recipes];
    const recipePages =
      (query: string, group: RecipeHitGroupType) =>
      (page: number): ReturnType<SearchRecipeGroupUseCase['execute']> =>
        deps.searchRecipeGroup.execute(query, group, page, FOOD_SEARCH_PAGE_SIZE);

    return {
      query: null,
      saved: { status: StoreStatus.Idle },
      mine: { status: StoreStatus.Idle },
      products: { status: StoreStatus.Idle },
      recipes: { status: StoreStatus.Idle },

      search: async (raw) => {
        const query = raw.trim();
        set({ query });
        if (query.length === ValueConstants.zero) {
          loaders.products.reset();
          await Promise.all(recipeGroups.map((group) => loaders[group].load(recipePages(query, group))));
          return;
        }
        const tokens = {
          saved: loaders.saved.begin(recipePages(query, FoodSearchGroup.Saved)),
          mine: loaders.mine.begin(recipePages(query, FoodSearchGroup.Mine)),
          recipes: loaders.recipes.begin(recipePages(query, FoodSearchGroup.Recipes)),
          products: loaders.products.begin((page) => deps.searchProducts.execute(query, page, FOOD_SEARCH_PAGE_SIZE)),
        };
        const result = await deps.searchFoods.execute(query, FOOD_SEARCH_PAGE_SIZE);
        for (const group of recipeGroups) loaders[group].settle(tokens[group], result.ok ? ok(result.value[group]) : result);
        loaders.products.settle(tokens.products, result.ok ? ok(result.value.products) : result);
      },

      loadMore: (group) => loaders[group].loadMore(),

      clear: () => {
        Object.values(loaders).forEach((loader) => loader.reset());
        set({ query: null });
      },
    };
  });
