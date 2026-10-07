import { act } from 'react-test-renderer';
import { FlatList } from 'react-native';
import { ok } from '@core/result/result-helpers';
import { configureFoodSearchStore } from '@application/diary/foods/food-search-store';
import { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { fakeFoodCatalogRepository, hitOf, pageOf, productOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { MealSlot } from '@domain/diary/meal-slot';
import { configureFoodCatalogStore } from '@application/diary/foods/food-catalog-store';
import { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { PickTab } from '@presentation/base/widgets/diary/add-food/list/pick-tab';
import { FoodSearchField } from '@presentation/base/widgets/diary/add-food/pick/food-search-field';
import { ADD_FOOD_SEARCH_DEBOUNCE_MS } from '@presentation/base/widgets/diary/add-food/list/search-debounce';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AddFoodPickStep } from '@presentation/base/widgets/diary/add-food/pick/add-food-pick-step';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

const textOf = (root: ReturnType<typeof renderComponent>['root']): string[] =>
  root.findAll((node) => typeof node.props.children === 'string').map((node) => node.props.children as string);

const setup = async (initialQuery = 'tomato') => {
  const repo = fakeFoodCatalogRepository();
  repo.search.mockResolvedValue(
    ok({ query: 'tomato', saved: pageOf([hitOf('s1')], 1, 9), mine: pageOf([hitOf('m1', true)]), products: pageOf([productOf()]), recipes: pageOf([]) }),
  );
  repo.searchRecipes.mockResolvedValue(ok(pageOf([hitOf('s2')], 2, 9)));
  const foodSearchStore = configureFoodSearchStore({
    searchFoods: new SearchFoodsUseCase(repo),
    searchRecipeGroup: new SearchRecipeGroupUseCase(repo),
    searchProducts: new SearchProductsUseCase(repo),
  });
  const foodCatalogStore = configureFoodCatalogStore({
    listCategories: new ListFoodCategoriesUseCase(repo),
    listProducts: new ListFoodProductsUseCase(repo),
    listRecent: new ListRecentFoodPageUseCase(repo),
    loadDetail: new LoadFoodDetailUseCase(repo),
  });
  const onChoose = jest.fn();
  const onChooseProduct = jest.fn();
  const view = renderComponent(
    <AddFoodPickStep
      initialQuery={initialQuery}
      initialMealText={null}
      meal={MealSlot.Lunch}
      isSubmitting={false}
      onChoose={onChoose}
      onChooseProduct={onChooseProduct}
      onChooseRecent={jest.fn()}
      onQuickAdd={jest.fn()}
      onLogMeal={jest.fn()}
    />,
    { foodSearchStore, foodCatalogStore } as unknown as Partial<ApplicationStores>,
  );
  await act(async () => undefined);
  return { repo, view, onChoose, onChooseProduct };
};

describe('AddFoodPickStep', () => {
  it('renders the server’s groups in order, the draft tag on an own unpublished recipe', async () => {
    const { repo, view } = await setup();
    expect(repo.search).toHaveBeenCalledWith('tomato', 8);
    const texts = textOf(view.root);
    const strings = t().diary;
    const order = [upperCase(strings.groupSaved), upperCase(strings.groupMine), upperCase(strings.groupProducts)].map((title) => texts.indexOf(title));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(texts).toContain(strings.draftTag);
    expect(texts).toContain('Ayran · Klasik');
  });

  it('loads the next page of the first group with more when the list reaches its end', async () => {
    const { repo, view } = await setup();
    const onEndReached: unknown = view.root.findByType(FlatList).props.onEndReached;
    if (typeof onEndReached !== 'function') throw new Error('the list does not page');
    await act(async () => onEndReached());
    expect(repo.searchRecipes).toHaveBeenCalledWith('tomato', 'saved', 2, 8);
    expect(textOf(view.root)).toContain('Recipe s2');
  });

  it('searches the recipe groups only while the Recipes tab shows', async () => {
    const { repo, view } = await setup('');
    expect(repo.searchRecipes).toHaveBeenCalledTimes(3);
    const onChange: unknown = view.root.findByType(SegmentedTabs).props.onChange;
    if (typeof onChange !== 'function') throw new Error('no tabs');
    await act(async () => onChange(PickTab.Recent));
    expect(repo.listRecent).toHaveBeenCalled();
    const typeInBox = (text: string): void => {
      const onChangeText: unknown = view.root.findByType(FoodSearchField).props.onChangeText;
      if (typeof onChangeText !== 'function') throw new Error('no search box');
      onChangeText(text);
    };
    await act(async () => typeInBox('ayran'));
    await act(() => new Promise((resolve) => setTimeout(resolve, ADD_FOOD_SEARCH_DEBOUNCE_MS + 50)));
    expect(repo.search).toHaveBeenLastCalledWith('ayran', 8);
    // Cleared while on Recent: the tab comes back, not a search of the recipe groups.
    await act(async () => typeInBox(''));
    expect(repo.searchRecipes).toHaveBeenCalledTimes(3);
  });
});
