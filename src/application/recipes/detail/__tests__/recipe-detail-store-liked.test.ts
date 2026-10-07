import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { StoreStatus } from '@application/store/store-status';
import { ok } from '@core/result/result-helpers';
import type { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import type { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import type { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';

/** The viewer's like rides beside the recipe in store state, never inside the entity (rule 19). */

const RECIPE_ID = 'recipe-1';

const storeWith = (likedByMe: boolean) =>
  configureRecipeDetailStore({
    getRecipe: {
      execute: async (id: string) => ok({ recipe: recipeEntityOf({ id }), likedByMe }),
    } as unknown as GetRecipeUseCase,
    addRecipePhoto: {} as AddRecipePhotoUseCase,
    removeRecipePhoto: {} as RemoveRecipePhotoUseCase,
    removeRecipeCover: {} as RemoveRecipeCoverUseCase,
  });

describe('recipeDetailStore — the viewer\'s like', () => {
  it('keeps the like the server reported next to the loaded recipe', async () => {
    const store = storeWith(true);

    await store.getState().load(RECIPE_ID);

    const state = store.getState().byId[RECIPE_ID];
    expect(state?.status === StoreStatus.Loaded && state.likedByMe).toBe(true);
  });

  it('does not forget the like when a newer copy of the recipe is put in place', async () => {
    const store = storeWith(true);
    await store.getState().load(RECIPE_ID);

    store.getState().put(recipeEntityOf({ id: RECIPE_ID, name: 'Renamed' }));

    const state = store.getState().byId[RECIPE_ID];
    expect(state?.status === StoreStatus.Loaded && state.recipe.name).toBe('Renamed');
    expect(state?.status === StoreStatus.Loaded && state.likedByMe).toBe(true);
  });

  // An edit re-puts the recipe; a fresh stamp on the old flag made the likes overlay
  // take "not liked" as newer than the tap that liked it, and the heart emptied.
  it('keeps the like\'s own age when a newer copy is put, so the flag cannot outrank a later like', async () => {
    const store = storeWith(false);
    await store.getState().load(RECIPE_ID);
    const loaded = store.getState().byId[RECIPE_ID];
    const loadedAt = loaded?.status === StoreStatus.Loaded ? loaded.fetchedAt : -1;

    jest.spyOn(Date, 'now').mockReturnValue(loadedAt + 60_000);
    store.getState().put(recipeEntityOf({ id: RECIPE_ID, name: 'Edited' }));
    jest.restoreAllMocks();

    const state = store.getState().byId[RECIPE_ID];
    expect(state?.status === StoreStatus.Loaded && state.fetchedAt).toBe(loadedAt);
  });

  it('reads a recipe put without a prior load as not liked', () => {
    const store = storeWith(true);

    store.getState().put(recipeEntityOf({ id: RECIPE_ID }));

    const state = store.getState().byId[RECIPE_ID];
    expect(state?.status === StoreStatus.Loaded && state.likedByMe).toBe(false);
    expect(state?.status === StoreStatus.Loaded && state.fetchedAt).toBe(0);
  });
});
