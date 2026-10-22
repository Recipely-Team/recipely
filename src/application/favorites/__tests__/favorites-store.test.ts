import { create } from 'zustand';
import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { configureFavoritesStore } from '@application/favorites/favorites-store';
import type { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import type { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

const setup = (answer: Awaited<ReturnType<AddFavoriteUseCase['execute']>>) => {
  const addLocal = jest.fn();
  const removeLocal = jest.fn();
  const saved = create<SavedRecipesStoreState>(() => ({ addLocal, removeLocal }) as unknown as SavedRecipesStoreState);
  const add = { execute: jest.fn().mockResolvedValue(answer) };
  const store = configureFavoritesStore({
    addFavoriteUseCase: add as unknown as AddFavoriteUseCase,
    removeFavoriteUseCase: { execute: jest.fn().mockResolvedValue(answer) } as unknown as RemoveFavoriteUseCase,
    savedRecipesStore: saved,
  });
  return { store, add, addLocal, removeLocal };
};

describe('favoritesStore', () => {
  it('mirrors a successful add and remove into the saved set', async () => {
    const s = setup(ok(undefined));
    await s.store.getState().addFavorite('u1', 'r1');
    expect(await s.store.getState().removeFavorite('u1', 'r1')).toBeNull();
    expect(s.addLocal).toHaveBeenCalledWith('r1');
    expect(s.removeLocal).toHaveBeenCalledWith('r1');
    expect(s.store.getState()).toMatchObject({ isLoading: false });
  });

  it('keeps the failure and leaves the saved set alone when the server refuses', async () => {
    const failure = new NetworkFailure('offline');
    const s = setup(fail(failure));
    expect(await s.store.getState().addFavorite('u1', 'r1')).toBe(failure);
    expect(s.addLocal).not.toHaveBeenCalled();
    expect(s.store.getState()).toMatchObject({ isLoading: false });
  });
});

// Regression: the store held ONE shared `error` that each caller read after
// its own await, so with two saves in flight the failure of one recipe was
// toasted for the other, and the successful one could swallow it.
describe('favoritesStore — each call answers for itself', () => {
  it('two saves in flight each get their own answer', async () => {
    const failure = new NetworkFailure('r1 refused');
    const s = setup(ok(undefined));
    (s.add.execute as jest.Mock).mockImplementation((_u: string, id: string) =>
      Promise.resolve(id === 'r1' ? fail(failure) : ok(undefined)));

    const [first, second] = await Promise.all([
      s.store.getState().addFavorite('u1', 'r1'),
      s.store.getState().addFavorite('u1', 'r2'),
    ]);

    expect(first).toBe(failure);
    expect(second).toBeNull();
    expect(s.addLocal.mock.calls.map(([id]) => id)).toEqual(['r2']);
  });
});

describe('favoritesStore — one guard per recipe', () => {
  it('saves a second recipe while the first is still on its way, and ignores a repeat of the first', async () => {
    const s = setup(ok(undefined));
    const first = s.store.getState().addFavorite('u1', 'r1');
    expect(s.store.getState().pending.has('r1')).toBe(true);
    const repeat = s.store.getState().addFavorite('u1', 'r1');
    const second = s.store.getState().addFavorite('u1', 'r2');
    await Promise.all([first, repeat, second]);
    expect(s.addLocal.mock.calls.map(([id]) => id)).toEqual(['r1', 'r2']);
    expect(s.store.getState().pending.size).toBe(0);
    expect(s.store.getState().isLoading).toBe(false);
  });
});
