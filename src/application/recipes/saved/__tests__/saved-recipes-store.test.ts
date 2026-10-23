import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { configureSavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { recipeSummaryOf } from '@application/__fixtures__/recipe-summary-of';

const storeOver = (execute: jest.Mock) =>
  configureSavedRecipesStore({ loadFavoritesUseCase: { execute } as unknown as LoadFavoritesUseCase });
const ids = (store: ReturnType<typeof storeOver>): string[] => loadedItems(store.getState().saved).map((r) => r.id);

describe('savedRecipesStore', () => {
  it('loads the first page into one ListLoaded state: rows, total and next-page state together', async () => {
    const store = storeOver(jest.fn().mockResolvedValue(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')], { total: 5, pageSize: 2 }))));

    expect(await store.getState().loadSaved()).toBeNull();

    const saved = store.getState().saved;
    expect(saved.status).toBe(StoreStatus.Loaded);
    expect(saved.status === StoreStatus.Loaded && saved.total).toBe(5);
    expect(saved.status === StoreStatus.Loaded && saved.hasMore).toBe(true);
    expect([...store.getState().savedIds]).toEqual(['a', 'b']);
  });

  it('appends the next page and adds its ids to the saved set', async () => {
    const execute = jest.fn()
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')], { total: 4, pageSize: 2 })))
      .mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('c'), recipeSummaryOf('d')], { page: 2, total: 4, pageSize: 2 })));
    const store = storeOver(execute);
    await store.getState().loadSaved();

    await store.getState().loadMoreSaved();

    expect(ids(store)).toEqual(['a', 'b', 'c', 'd']);
    expect(store.getState().has('d')).toBe(true);
  });

  it('a failed reload keeps the saved grid on screen and answers the failure to the caller', async () => {
    const failure = new NetworkFailure('offline');
    const execute = jest.fn().mockResolvedValueOnce(ok(recipePageOf([recipeSummaryOf('a')]))).mockResolvedValueOnce(fail(failure));
    const store = storeOver(execute);
    await store.getState().loadSaved();

    expect(await store.getState().loadSaved()).toBe(failure);
    expect(ids(store)).toEqual(['a']);
  });

  it('unsaving removes the card and counts it out of the total', async () => {
    const store = storeOver(jest.fn().mockResolvedValue(ok(recipePageOf([recipeSummaryOf('a'), recipeSummaryOf('b')]))));
    await store.getState().loadSaved();

    store.getState().toggle('a');

    expect(ids(store)).toEqual(['b']);
    expect(store.getState().has('a')).toBe(false);
    const saved = store.getState().saved;
    expect(saved.status === StoreStatus.Loaded && saved.total).toBe(1);
  });

  it('a local save marks the bookmark before any list has loaded', () => {
    const store = storeOver(jest.fn());

    store.getState().addLocal('x');

    expect(store.getState().has('x')).toBe(true);
  });

  it('adopts a first page fetched elsewhere (the sign-in pre-load)', () => {
    const store = storeOver(jest.fn());

    store.getState().setSaved(recipePageOf([recipeSummaryOf('pre')]));

    expect(ids(store)).toEqual(['pre']);
    expect(store.getState().has('pre')).toBe(true);
  });

  it('a load still in flight at sign-out cannot put the previous account back', async () => {
    let answer: (value: unknown) => void = () => undefined;
    const store = storeOver(jest.fn(() => new Promise((resolve) => { answer = resolve; })));

    const pending = store.getState().loadSaved();
    store.getState().clear();
    answer(ok(recipePageOf([recipeSummaryOf('previous-user')])));
    await pending;

    expect(store.getState().saved.status).toBe(StoreStatus.Idle);
    expect(store.getState().has('previous-user')).toBe(false);
  });
});
