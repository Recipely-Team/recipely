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
  const store = configureFavoritesStore({
    addFavoriteUseCase: { execute: jest.fn().mockResolvedValue(answer) } as unknown as AddFavoriteUseCase,
    removeFavoriteUseCase: { execute: jest.fn().mockResolvedValue(answer) } as unknown as RemoveFavoriteUseCase,
    savedRecipesStore: saved,
  });
  return { store, addLocal, removeLocal };
};

describe('favoritesStore', () => {
  it('mirrors a successful add and remove into the saved set', async () => {
    const s = setup(ok(undefined));
    await s.store.getState().addFavorite('u1', 'r1');
    await s.store.getState().removeFavorite('u1', 'r1');
    expect(s.addLocal).toHaveBeenCalledWith('r1');
    expect(s.removeLocal).toHaveBeenCalledWith('r1');
    expect(s.store.getState()).toMatchObject({ isLoading: false, error: null });
  });

  it('keeps the failure and leaves the saved set alone when the server refuses', async () => {
    const failure = new NetworkFailure('offline');
    const s = setup(fail(failure));
    await s.store.getState().addFavorite('u1', 'r1');
    expect(s.addLocal).not.toHaveBeenCalled();
    expect(s.store.getState()).toMatchObject({ isLoading: false, error: failure });
    s.store.getState().clearError();
    expect(s.store.getState().error).toBeNull();
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
