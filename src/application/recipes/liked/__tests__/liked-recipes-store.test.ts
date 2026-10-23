import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { recipeSummaryOf } from '@application/__fixtures__/recipe-summary-of';

const storeOver = (execute: jest.Mock) =>
  configureLikedRecipesStore({ loadLikedRecipesUseCase: { execute } as unknown as LoadLikedRecipesUseCase });
const ids = (store: ReturnType<typeof storeOver>): string[] => loadedItems(store.getState().liked).map((r) => r.id);

describe('likedRecipesStore', () => {
  it('appends the next page', async () => {
    const execute = jest.fn()
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')], { total: 3, pageSize: 2 })))
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('c')], { page: 2, total: 3, pageSize: 2 })));
    const store = storeOver(execute);
    await store.getState().loadLiked();

    await store.getState().loadMoreLiked();

    expect(ids(store)).toEqual(['a', 'b', 'c']);
  });

  it('after an unlike, the next page re-reads from the shifted offset instead of skipping a row', async () => {
    const execute = jest.fn()
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')], { total: 4, pageSize: 2 })))
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('c'), recipeSummaryOf('d')], { page: 2, total: 3, pageSize: 2 })));
    const store = storeOver(execute);
    await store.getState().loadLiked();
    store.getState().removeLocal('a');

    await store.getState().loadMoreLiked();

    expect(execute).toHaveBeenLastCalledWith(1);
    expect(ids(store)).toEqual(['b', 'c', 'd']);
  });

  it('a failed reload keeps the rows and answers the failure', async () => {
    const failure = new NetworkFailure('offline');
    const store = storeOver(jest.fn().mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a')]))).mockResolvedValueOnce(fail(failure)));
    await store.getState().loadLiked();

    expect(await store.getState().loadLiked()).toBe(failure);
    expect(ids(store)).toEqual(['a']);
  });

  it('a first load that fails is the ListError state, not an empty list', async () => {
    const failure = new NetworkFailure('offline');
    const store = storeOver(jest.fn().mockResolvedValue(fail(failure)));

    await store.getState().loadLiked();

    expect(store.getState().liked).toEqual({ status: StoreStatus.Error, failure });
  });

  it('clear returns to idle and drops an answer still in flight', async () => {
    let answer: (value: unknown) => void = () => undefined;
    const store = storeOver(jest.fn(() => new Promise((resolve) => { answer = resolve; })));
    const pending = store.getState().loadLiked();

    store.getState().clear();
    answer(ok(recipePageOf([recipeSummaryOf('previous-user')])));
    await pending;

    expect(store.getState().liked.status).toBe(StoreStatus.Idle);
  });
});
