import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Page } from '@domain/common/page';
import { StoreStatus } from '@application/store/store-status';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { configureFoodSearchStore } from '@application/diary/foods/food-search-store';
import { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { fakeFoodCatalogRepository, hitOf, pageOf, productOf } from '@application/diary/foods/__fixtures__/food-fixtures';

const results = (query: string, savedTotal = 1): FoodSearchResults => ({
  query,
  saved: pageOf([hitOf(`${query}-s1`)], 1, savedTotal),
  mine: pageOf([hitOf('m1', true)]),
  products: pageOf([productOf()]),
  recipes: pageOf([]),
});

const setup = () => {
  const repo = fakeFoodCatalogRepository();
  const store = configureFoodSearchStore({
    searchFoods: new SearchFoodsUseCase(repo),
    searchRecipeGroup: new SearchRecipeGroupUseCase(repo),
    searchProducts: new SearchProductsUseCase(repo),
  });
  return { repo, store };
};

/** A promise the test answers by hand, to hold a request in flight. */
const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

const savedIds = (store: ReturnType<typeof setup>['store']): string[] | null => {
  const saved = store.getState().saved;
  return saved.status === StoreStatus.Loaded ? saved.items.map((h) => h.id) : null;
};

describe('foodSearchStore', () => {
  it('fills every group from one request for a query', async () => {
    const { repo, store } = setup();
    repo.search.mockResolvedValue(ok(results('tomato')));
    await store.getState().search(' tomato ');
    const s = store.getState();
    expect(repo.search).toHaveBeenCalledWith('tomato', 8);
    expect(s.query).toBe('tomato');
    expect(savedIds(store)).toEqual(['tomato-s1']);
    expect(s.products.status === StoreStatus.Loaded && s.products.items).toHaveLength(1);
  });

  it('joins a repeat of the query already in flight instead of sending it again', async () => {
    const { repo, store } = setup();
    repo.search.mockResolvedValue(ok(results('menem')));
    await Promise.all([store.getState().search('menem'), store.getState().search(' menem ')]);
    expect(repo.search).toHaveBeenCalledTimes(1);
    await store.getState().search('menem');
    expect(repo.search).toHaveBeenCalledTimes(2);
  });

  it('lists the recipe groups unfiltered, one request each, for an empty query', async () => {
    const { repo, store } = setup();
    await store.getState().search('');
    expect(repo.search).not.toHaveBeenCalled();
    expect(repo.searchRecipes.mock.calls.map((c) => c[1])).toEqual(['saved', 'mine', 'recipes']);
    expect(repo.searchRecipes).toHaveBeenCalledWith('', 'saved', 1, 8);
    expect(store.getState().products.status).toBe(StoreStatus.Idle);
  });

  it('loads a group’s next page with its group and page, and appends it once', async () => {
    const { repo, store } = setup();
    repo.search.mockResolvedValue(ok(results('tomato', 9)));
    repo.searchRecipes.mockResolvedValue(ok(pageOf([hitOf('s2'), hitOf('tomato-s1')], 2, 9)));
    await store.getState().search('tomato');
    await store.getState().loadMore(FoodSearchGroup.Saved);
    expect(repo.searchRecipes).toHaveBeenCalledWith('tomato', 'saved', 2, 8);
    expect(savedIds(store)).toEqual(['tomato-s1', 's2']);
    await store.getState().loadMore(FoodSearchGroup.Saved);
    expect(repo.searchRecipes).toHaveBeenCalledTimes(1);
  });

  it('never lets an older query’s answer replace a newer one', async () => {
    const { repo, store } = setup();
    const slow = deferred<Result<FoodSearchResults, NetworkFailure>>();
    repo.search.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(ok(results('tomatoes')));
    const first = store.getState().search('tom');
    await store.getState().search('tomatoes');
    slow.resolve(ok(results('tom')));
    await first;
    expect(store.getState().query).toBe('tomatoes');
    expect(savedIds(store)).toEqual(['tomatoes-s1']);
  });

  it('drops a next page that answers after a new search began', async () => {
    const { repo, store } = setup();
    repo.search.mockResolvedValue(ok(results('tomato', 9)));
    const slowMore = deferred<Result<Page<RecipeFoodHit>, NetworkFailure>>();
    repo.searchRecipes.mockReturnValueOnce(slowMore.promise);
    await store.getState().search('tomato');
    const more = store.getState().loadMore(FoodSearchGroup.Saved);
    repo.search.mockResolvedValue(ok(results('pepper')));
    await store.getState().search('pepper');
    slowMore.resolve(ok(pageOf([hitOf('stale')], 2, 9)));
    await more;
    expect(savedIds(store)).toEqual(['pepper-s1']);
  });

  it('shows a failed first page as an error, and keeps the rows when a next page fails', async () => {
    const { repo, store } = setup();
    repo.search.mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await store.getState().search('tomato');
    expect(store.getState().saved.status).toBe(StoreStatus.Error);

    repo.search.mockResolvedValueOnce(ok(results('tomato', 9)));
    repo.searchRecipes.mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await store.getState().search('tomato');
    await store.getState().loadMore(FoodSearchGroup.Saved);
    const saved = store.getState().saved;
    expect(savedIds(store)).toHaveLength(1);
    expect(saved.status === StoreStatus.Loaded && saved.moreFailure).not.toBeNull();
  });
});
