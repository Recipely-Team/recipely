import { useCallback, useEffect, useState } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { PagedList } from '@application/store/paging/paged-list';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ADD_FOOD_SEARCH_DEBOUNCE_MS } from '@presentation/base/widgets/diary/add-food/list/search-debounce';

interface PlanRecipePicker {
  tab: RecipeHitGroupType;
  setTab: (tab: RecipeHitGroupType) => void;
  query: string;
  setQuery: (query: string) => void;
  recipes: PagedList<RecipeFoodHit>;
  loadMore: () => void;
  /** Asks for the current tab and query again, after a failure. */
  retry: () => void;
}

/**
 * The add sheet's recipe list: Saved, My recipes, or a search of every
 * recipe — paged by the server (`mealPlanStore.searchRecipes`).
 *
 * @remarks
 * - **Search waits for typing to pause** (the Add food sheet's debounce);
 *   an empty query lists the group unfiltered (the server's top recipes).
 * - **Only the Search tab filters**; Saved and My recipes list everything.
 */
export const usePlanRecipePicker = (): PlanRecipePicker => {
  const { mealPlanStore } = useStores();
  const recipes = mealPlanStore((s) => s.recipes);
  const [tab, setTab] = useState<RecipeHitGroupType>(FoodSearchGroup.Saved);
  const [query, setQuery] = useState(CharConstants.empty);

  const isSearch = tab === FoodSearchGroup.Recipes;
  const search = useCallback(
    () => void mealPlanStore.getState().searchRecipes(isSearch ? query.trim() : CharConstants.empty, tab),
    [isSearch, mealPlanStore, query, tab],
  );

  useEffect(() => {
    const handle = setTimeout(search, isSearch ? ADD_FOOD_SEARCH_DEBOUNCE_MS : ValueConstants.zero);
    return () => clearTimeout(handle);
  }, [isSearch, search]);

  return { tab, setTab, query, setQuery, recipes, loadMore: () => void mealPlanStore.getState().loadMoreRecipes(), retry: search };
};
