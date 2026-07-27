/**
 * Reported: like a recipe on its detail screen, go back, open it again — the
 * heart is empty. Re-entering re-renders the recipe from the detail cache, a
 * copy that was read BEFORE the like, and publishing it rewound the overlay to
 * `likedByMe: false`. A response can only overwrite the overlay when it is
 * newer than what produced it.
 */

import { configureLikesStore } from '@application/likes/configure-likes-store';
import type { LikesStore } from '@application/likes/likes-store';
import type { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import type { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { ok } from '@core/result/result-helpers';

const RECIPE_ID = 'r-1';

const makeStore = (): LikesStore =>
  configureLikesStore({
    likeRecipe: { execute: () => Promise.resolve(ok(undefined)) } as unknown as LikeRecipeUseCase,
    unlikeRecipe: { execute: () => Promise.resolve(ok(undefined)) } as unknown as UnlikeRecipeUseCase,
  });

describe('likesStore.syncFromApi — freshness', () => {
  it('ignores a payload older than the like the user just made', async () => {
    const store = makeStore();
    store.getState().seed(RECIPE_ID, 3, false);
    const staleFetchedAt = Date.now() - 10_000;

    await store.getState().toggle(RECIPE_ID);
    // The detail screen re-mounts and republishes its cached (pre-like) copy.
    store.getState().syncFromApi(RECIPE_ID, 3, false, staleFetchedAt);

    expect(store.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(true);
    expect(store.getState().byRecipe[RECIPE_ID]?.likeCount).toBe(4);
  });

  it('takes a payload read after the like — the server is right about the rest', async () => {
    const store = makeStore();
    store.getState().seed(RECIPE_ID, 3, false);

    await store.getState().toggle(RECIPE_ID);
    // A refetch that happened after the toggle: someone else liked it too.
    store.getState().syncFromApi(RECIPE_ID, 9, true, Date.now() + 1_000);

    expect(store.getState().byRecipe[RECIPE_ID]?.likeCount).toBe(9);
    expect(store.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(true);
  });

  it('accepts an unlike made elsewhere when the payload is newer', () => {
    const store = makeStore();
    store.getState().seed(RECIPE_ID, 3, true);

    store.getState().syncFromApi(RECIPE_ID, 2, false, Date.now() + 1_000);

    expect(store.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(false);
  });

  it('still fills an empty overlay whatever the payload date', () => {
    const store = makeStore();

    store.getState().syncFromApi(RECIPE_ID, 3, true, Date.now() - 60_000);

    expect(store.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(true);
  });

  it('leaves an in-flight toggle alone', async () => {
    const store = makeStore();
    store.getState().seed(RECIPE_ID, 3, false);

    const toggling = store.getState().toggle(RECIPE_ID);
    store.getState().syncFromApi(RECIPE_ID, 3, false, Date.now() + 1_000);
    expect(store.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(true);

    await toggling;
  });
});
