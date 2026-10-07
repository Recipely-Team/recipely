import { RemoveRecipeMediaUseCase } from '@application/recipes/photos/remove-recipe-media-use-case';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import type { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { MediaType } from '@domain/recipes/media/media-type';

/**
 * The cover used to be the one photo the owner could not take off: a cover-only
 * recipe mapped to a gallery item with no id, and the remove control needs one.
 * The use case picks the request by what the item is, not by whether it has a row.
 */

const RECIPE_ID = 'recipe-1';
const PHOTO = { id: 'media-1', type: MediaType.Image, url: 'https://example.test/p.jpg' };
const COVER = { id: 'media-cover', type: MediaType.Image, url: 'https://example.test/cover.jpg' };
const recipe = recipeEntityOf({ id: RECIPE_ID, image: COVER.url, media: [COVER, PHOTO] });

function harness(cover: ReturnType<typeof ok> | ReturnType<typeof fail> = ok({ image: PHOTO.url, removedMediaIds: [COVER.id] })) {
  const removedPhotos: string[] = [];
  let coverRemovals = 0;
  const removePhoto = {
    execute: async (_recipeId: string, mediaId: string) => {
      removedPhotos.push(mediaId);
      return ok(undefined);
    },
  } as unknown as RemoveRecipePhotoUseCase;
  const removeCover = {
    execute: async () => {
      coverRemovals += 1;
      return cover;
    },
  } as unknown as RemoveRecipeCoverUseCase;
  const useCase = new RemoveRecipeMediaUseCase(removePhoto, removeCover);
  return { useCase, removedPhotos, coverRemovals: () => coverRemovals };
}

describe('RemoveRecipeMediaUseCase', () => {
  it('takes the cover off through the cover request and answers the next photo as cover', async () => {
    const { useCase, removedPhotos, coverRemovals } = harness();

    const result = await useCase.execute(RECIPE_ID, recipe, COVER);

    expect(result.ok && result.value?.image).toBe(PHOTO.url);
    expect(coverRemovals()).toBe(1);
    expect(removedPhotos).toEqual([]);
  });

  it('removes a cover that has no gallery row', async () => {
    const { useCase, coverRemovals } = harness();

    await useCase.execute(RECIPE_ID, recipe, { type: MediaType.Image, url: COVER.url });

    expect(coverRemovals()).toBe(1);
  });

  it('removes a gallery photo through the photo request and asks for a reload', async () => {
    const { useCase, removedPhotos, coverRemovals } = harness();

    const result = await useCase.execute(RECIPE_ID, recipe, PHOTO);

    expect(result).toEqual(ok(null));
    expect(removedPhotos).toEqual([PHOTO.id]);
    expect(coverRemovals()).toBe(0);
  });

  it('asks the server nothing for a photo that is only on the device', async () => {
    const { useCase, removedPhotos, coverRemovals } = harness();

    const result = await useCase.execute(RECIPE_ID, recipe, { type: MediaType.Image, url: 'file://local.jpg' });

    expect(result).toEqual(ok(null));
    expect(removedPhotos).toEqual([]);
    expect(coverRemovals()).toBe(0);
  });

  it('hands a refused cover removal back', async () => {
    const refused = new UnknownFailure('nope');
    const { useCase } = harness(fail(refused));

    const result = await useCase.execute(RECIPE_ID, recipe, COVER);

    expect(result).toEqual(fail(refused));
  });
});
