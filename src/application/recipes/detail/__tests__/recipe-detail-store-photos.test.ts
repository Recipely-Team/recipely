import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { StoreStatus } from '@application/store/store-status';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import type { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';

/**
 * Editing a published recipe was removed, so adding a photo to one is the
 * owner's only way back into their own gallery. The gallery renders from the
 * loaded recipe, which is why every one of these ends in a reload rather than
 * an optimistic append: a second copy of the truth is a second thing to keep
 * right, and the request is the slow part anyway.
 */

const RECIPE_ID = 'recipe-1';
const PHOTO = { id: 'media-1', type: 'image' as const, url: 'https://example.test/p.jpg' };

function harness(
  overrides: {
    add?: ReturnType<typeof ok> | ReturnType<typeof fail>;
    remove?: ReturnType<typeof ok> | ReturnType<typeof fail>;
  } = {},
) {
  const loads: string[] = [];
  const getRecipe = {
    execute: async (id: string) => {
      loads.push(id);
      return ok({ id } as never);
    },
  } as unknown as GetRecipeUseCase;

  const addRecipePhoto = {
    execute: async () => overrides.add ?? ok(PHOTO),
  } as unknown as AddRecipePhotoUseCase;
  const removeRecipePhoto = {
    execute: async () => overrides.remove ?? ok(undefined),
  } as unknown as RemoveRecipePhotoUseCase;

  const store = configureRecipeDetailStore({ getRecipe, addRecipePhoto, removeRecipePhoto });
  return { store, loads };
}

describe('photos on a published recipe', () => {
  it('reloads the recipe once a photo is added', async () => {
    const { store, loads } = harness();

    const failure = await store.getState().addPhoto(RECIPE_ID, 'file://a.jpg', 'a.jpg', 'image/jpeg');

    expect(failure).toBeNull();
    expect(loads).toEqual([RECIPE_ID]);
  });

  it('reloads once a photo is removed', async () => {
    const { store, loads } = harness();

    const failure = await store.getState().removePhoto(RECIPE_ID, 'media-1');

    expect(failure).toBeNull();
    expect(loads).toEqual([RECIPE_ID]);
  });

  /**
   * The screen tells a refused photo apart from one the server could not check,
   * and it does that by reading the failure — so the failure has to reach it
   * rather than being swallowed into a boolean.
   */
  it('hands the failure back and does not reload', async () => {
    const refused = new UnknownFailure('rejected');
    const { store, loads } = harness({ add: fail(refused) });

    const failure = await store.getState().addPhoto(RECIPE_ID, 'file://a.jpg', 'a.jpg', 'image/jpeg');

    expect(failure).toBe(refused);
    expect(loads).toEqual([]);
  });

  it('is not busy once the work has finished, either way', async () => {
    const { store } = harness({ add: fail(new UnknownFailure('nope')) });

    await store.getState().addPhoto(RECIPE_ID, 'file://a.jpg', 'a.jpg', 'image/jpeg');

    expect(store.getState().isPhotoBusy).toBe(false);
  });

  it('leaves a recipe nobody asked about alone', async () => {
    const { store } = harness();

    await store.getState().addPhoto(RECIPE_ID, 'file://a.jpg', 'a.jpg', 'image/jpeg');

    expect(store.getState().byId['other']).toBeUndefined();
    expect(store.getState().byId[RECIPE_ID]?.status).toBe(StoreStatus.Loaded);
  });
});
