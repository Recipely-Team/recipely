import { ok } from '@core/result/result-helpers';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { configureMyRecipesStore } from '@application/recipes/my-recipes/my-recipes-store';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { recipeSummaryOf } from '@application/__fixtures__/recipe-summary-of';

const storeOver = (execute: jest.Mock) =>
  configureMyRecipesStore({ listMyRecipesUseCase: { execute } as unknown as ListMyRecipesUseCase });
const ids = (store: ReturnType<typeof storeOver>): string[] => loadedItems(store.getState().mine).map((r) => r.id);

describe('myRecipesStore', () => {
  it('a recipe created after the list loaded appears at the top and is counted', async () => {
    const store = storeOver(jest.fn().mockResolvedValue(ok(recipePageOf([recipeSummaryOf('old')]))));
    await store.getState().loadMine();

    store.getState().addLocal(recipeSummaryOf('new'));

    expect(ids(store)).toEqual(['new', 'old']);
    const mine = store.getState().mine;
    expect(mine.status === StoreStatus.Loaded && mine.total).toBe(2);
  });

  it('a deleted recipe leaves the list and the total', async () => {
    const store = storeOver(jest.fn().mockResolvedValue(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')]))));
    await store.getState().loadMine();

    store.getState().removeLocal('a');

    expect(ids(store)).toEqual(['b']);
    const mine = store.getState().mine;
    expect(mine.status === StoreStatus.Loaded && mine.total).toBe(1);
  });

  it('pages to the end and stops at the server total', async () => {
    const execute = jest.fn()
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a')], { total: 2, pageSize: 1 })))
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('b')], { page: 2, total: 2, pageSize: 1 })));
    const store = storeOver(execute);
    await store.getState().loadMine();

    await store.getState().loadMoreMine();
    await store.getState().loadMoreMine();

    expect(ids(store)).toEqual(['a', 'b']);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('clear returns to idle, so the next account gets a skeleton', async () => {
    const store = storeOver(jest.fn().mockResolvedValue(ok(recipePageOf([recipeSummaryOf('a')]))));
    await store.getState().loadMine();

    store.getState().clear();

    expect(store.getState().mine.status).toBe(StoreStatus.Idle);
  });
});
