import { ValueConstants } from '@core/constants';
import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';
import { type Failure, UnknownFailure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { FavoritesStore } from '@application/favorites/favorites-store-contract';
import type { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import type { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store-contract';

interface FavoritesStoreDeps {
  addFavoriteUseCase: AddFavoriteUseCase;
  removeFavoriteUseCase: RemoveFavoriteUseCase;
  savedRecipesStore: StoreApi<SavedRecipesStore>;
}

/**
 * Saves and unsaves recipes, one request per recipe at a time.
 *
 * @remarks
 * - **Each call returns its own `Failure`.** The store used to hold one shared
 *   `error`, and a caller read it after its await: with two saves in flight,
 *   one recipe's failure was toasted for the other, or cleared before its own
 *   caller saw it. Errors are page-scoped, as in the auth store.
 */
export const configureFavoritesStore = (deps: FavoritesStoreDeps): StoreApi<FavoritesStore> => {
  const { addFavoriteUseCase, removeFavoriteUseCase, savedRecipesStore } = deps;

  return createStore<FavoritesStore>((set, get) => {
    const begin = (recipeId: string): boolean => {
      if (get().pending.has(recipeId)) return false;
      set({ pending: new Set(get().pending).add(recipeId), isLoading: true });
      return true;
    };
    const end = (recipeId: string): void => {
      const pending = new Set(get().pending);
      pending.delete(recipeId);
      set({ pending, isLoading: pending.size > ValueConstants.zero });
    };
    const run = async (
      recipeId: string,
      call: () => Promise<Result<void, Failure>>,
      onSuccess: () => void,
    ): Promise<Failure | null> => {
      if (!begin(recipeId)) return null;
      try {
        const result = await call();
        if (result.ok) onSuccess();
        return result.ok ? null : result.failure;
      } catch (err) {
        return new UnknownFailure(err instanceof Error ? err.message : String(err), err);
      } finally {
        end(recipeId);
      }
    };
    return {
      isLoading: false,
      pending: new Set<string>(),
      addFavorite: (recipeId) =>
        run(recipeId, () => addFavoriteUseCase.execute(recipeId), () => savedRecipesStore.getState().addLocal(recipeId)),
      removeFavorite: (recipeId) =>
        run(recipeId, () => removeFavoriteUseCase.execute(recipeId), () => savedRecipesStore.getState().removeLocal(recipeId)),
    };
  });
};
