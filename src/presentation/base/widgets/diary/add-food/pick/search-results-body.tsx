import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { useCallback, useMemo } from 'react';
import { useStore } from 'zustand';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useFoodSearchQuery } from '@presentation/base/hooks/diary/use-food-search-query';
import { FoodSearchGroup, type FoodSearchGroupType } from '@domain/diary/foods/search/food-search-group';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import { FoodPickList } from '@presentation/base/widgets/diary/add-food/pick/food-pick-list';
import { PickSkeleton } from '@presentation/base/widgets/diary/add-food/pick/pick-skeleton';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { searchRows, SEARCH_GROUP_ORDER } from '@presentation/base/widgets/diary/add-food/list/search-rows';
import { phaseOfLists } from '@presentation/base/widgets/diary/add-food/list/phase-of-lists';
import { nextListToLoad } from '@presentation/base/widgets/diary/add-food/list/next-list-to-load';
import { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface SearchResultsBodyProps {
  /** The box's text as typed; empty on the Recipes tab, which lists the recipe groups unfiltered. */
  rawQuery: string;
  onChoose: (food: LoggableFood) => void;
  onChooseProduct: (product: FoodProduct) => void;
  /** No results: open Quick add with the query as the name. */
  onQuickAdd: () => void;
}

const isSearchGroup = (key: string): key is FoodSearchGroupType => (SEARCH_GROUP_ORDER as readonly string[]).includes(key);

/**
 * Search results — or, with no query, the Recipes tab — grouped Saved · My
 * recipes · Products · Recipes, each group paging on scroll (Add food v2
 * spec §3, §4): skeleton, no-results and failed faces first.
 */
export const SearchResultsBody = ({ rawQuery, onChoose, onChooseProduct, onQuickAdd }: SearchResultsBodyProps): React.JSX.Element => {
  const t = useTranslations();
  const { foodSearchStore } = useStores();
  useFoodSearchQuery(rawQuery);
  const query = rawQuery.trim();
  const saved = useStore(foodSearchStore, (s) => s.saved);
  const mine = useStore(foodSearchStore, (s) => s.mine);
  const products = useStore(foodSearchStore, (s) => s.products);
  const recipes = useStore(foodSearchStore, (s) => s.recipes);
  const strings = t.diary;
  const isTab = query.length === ValueConstants.zero;
  const lists = useMemo(() => ({ saved, mine, products, recipes }), [saved, mine, products, recipes]);
  const phase = phaseOfLists(isTab ? [saved, mine, recipes] : [saved, mine, products, recipes]);
  const loadMore = useCallback((key: string): void => {
    if (isSearchGroup(key)) void foodSearchStore.getState().loadMore(key);
  }, [foodSearchStore]);
  // Rows and handlers stay the same objects until their inputs change, so the memoized rows skip re-rendering.
  const rows = useMemo(
    () =>
      searchRows(lists, {
        [FoodSearchGroup.Saved]: strings.groupSaved,
        [FoodSearchGroup.Mine]: strings.groupMine,
        [FoodSearchGroup.Products]: strings.groupProducts,
        [FoodSearchGroup.Recipes]: isTab ? strings.groupFeed : strings.groupRecipes,
      }),
    [lists, strings, isTab],
  );
  const onPickRecipe = useCallback((hit: RecipeFoodHit) => onChoose(hit.food()), [onChoose]);
  const onEndReached = useCallback(() => {
    const next = nextListToLoad(SEARCH_GROUP_ORDER.map((key) => ({ key, list: lists[key] })));
    if (next !== null) loadMore(next);
  }, [lists, loadMore]);

  switch (phase.phase) {
    case PickPhase.Loading:
      return <PickSkeleton />;
    case PickPhase.Error:
      return (
        <PickMessage
          title={strings.loadFailed}
          hint={null}
          action={{ label: strings.tryAgain, icon: 'refresh', onPress: () => void foodSearchStore.getState().search(query) }}
        />
      );
    case PickPhase.Empty:
      return isTab ? (
        <PickMessage title={strings.recipesEmpty} hint={null} action={null} />
      ) : (
        <PickMessage
          title={strings.noResultsFor.replace('{q}', query)}
          hint={strings.noResultsHint}
          action={{ label: strings.tabQuickAdd, icon: 'flash', onPress: onQuickAdd }}
        />
      );
    case PickPhase.Ready:
      return (
        <FoodPickList
          rows={rows}
          onEndReached={onEndReached}
          onPickRecipe={onPickRecipe}
          onPickProduct={onChooseProduct}
          onRetryMore={loadMore}
        />
      );
  }
};
