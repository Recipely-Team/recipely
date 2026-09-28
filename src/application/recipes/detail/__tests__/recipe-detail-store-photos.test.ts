import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { StoreStatus } from '@application/store/store-status';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import type { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import type { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { MediaType } from '@domain/recipes/media/media-type';

/**
 * Editing a published recipe was removed, so adding a photo to one is the
 * owner's only way back into their own gallery. The gallery renders from the
 * loaded recipe, which is why every one of these ends in a reload rather than
 * an optimistic append: a second copy of the truth is a second thing to keep
 * right, and the request is the slow part anyway.
 */

const RECIPE_ID = 'recipe-1';
const PHOTO = { id: 'media-1', type: MediaType.Image, url: 'https://example.test/p.jpg' };
const COVER = { id: 'media-cover', type: MediaType.Image, url: 'https://example.test/cover.jpg' };

function harness(
  overrides: {
    add?: ReturnType<typeof ok> | ReturnType<typeof fail>;
    remove?: ReturnType<typeof ok> | ReturnType<typeof fail>;
    cover?: ReturnType<typeof ok> | ReturnType<typeof fail>;
  } = {},
) {
  const loads: string[] = [];
  const removedPhotos: string[] = [];
  let coverRemovals = 0;
  const getRecipe = {
    execute: async (id: string) => {
      loads.push(id);
      return ok(recipeEntityOf({ id, image: COVER.url, media: [COVER, PHOTO] }));
    },
  } as unknown as GetRecipeUseCase;

  const addRecipePhoto = {
    execute: async () => overrides.add ?? ok(PHOTO),
  } as unknown as AddRecipePhotoUseCase;
  const removeRecipePhoto = {
    execute: async (_recipeId: string, mediaId: string) => {
      removedPhotos.push(mediaId);
      return overrides.remove ?? ok(undefined);
    },
  } as unknown as RemoveRecipePhotoUseCase;
  const removeRecipeCover = {
    execute: async () => {
      coverRemovals += 1;
      return overrides.cover ?? ok({ image: PHOTO.url, removedMediaIds: [COVER.id] });
    },
  } as unknown as RemoveRecipeCoverUseCase;

  const store = configureRecipeDetailStore({ getRecipe, addRecipePhoto, removeRecipePhoto, removeRecipeCover });
  return { store, loads, removedPhotos, coverRemovals: () => coverRemovals };
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

    const failure = await store.getState().removePhoto(RECIPE_ID, PHOTO);

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

/**
 * The cover used to be the one photo the owner could not take off: a cover-only
 * recipe mapped to a gallery item with no id, and the remove control needs one.
 * A website import's cover is exactly the photo the owner has to remove.
 */
describe('removing the cover', () => {
  it('goes through the cover request, not the gallery one, and shows the next photo as cover', async () => {
    const { store, removedPhotos, coverRemovals } = harness();
    await store.getState().load(RECIPE_ID);

    const failure = await store.getState().removePhoto(RECIPE_ID, COVER);

    expect(failure).toBeNull();
    expect(coverRemovals()).toBe(1);
    expect(removedPhotos).toEqual([]);
  });

  it('puts the server answer on screen before the reload lands', async () => {
    const { store } = harness();
    await store.getState().load(RECIPE_ID);
    const puts: string[] = [];
    const unsubscribe = store.subscribe((s) => {
      const entry = s.byId[RECIPE_ID];
      if (entry?.status === StoreStatus.Loaded) puts.push(entry.recipe.image);
    });

    await store.getState().removePhoto(RECIPE_ID, COVER);
    unsubscribe();

    expect(puts).toContain(PHOTO.url);
  });

  it('removes a cover that has no gallery row', async () => {
    const { store, coverRemovals } = harness();
    await store.getState().load(RECIPE_ID);

    await store.getState().removePhoto(RECIPE_ID, { type: MediaType.Image, url: COVER.url });

    expect(coverRemovals()).toBe(1);
  });

  it('hands a refused cover removal back without reloading', async () => {
    const refused = new UnknownFailure('nope');
    const { store, loads } = harness({ cover: fail(refused) });
    await store.getState().load(RECIPE_ID);

    const failure = await store.getState().removePhoto(RECIPE_ID, COVER);

    expect(failure).toBe(refused);
    expect(loads).toEqual([RECIPE_ID]);
    expect(store.getState().isPhotoBusy).toBe(false);
  });
});
