import { configureLikesStore } from '@application/likes/likes-store';
import type { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import type { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import type { BoundStore } from '@application/store/bound-store';
import { ok } from '@core/result/result-helpers';

/**
 * "Beğen dedim beğenmedi", "beğenmekten vazgeçtim ama hâlâ beğendim gözüküyor",
 * "beğeni zaten çalışmıyor" — three reports of the heart disagreeing with what
 * the assistant said. Two attempts at fixing it were made by reading the code;
 * this pins the actual behaviour instead.
 */
const build = (calls: string[]) => {
  const likeRecipe = { execute: async (id: string) => { calls.push(`like:${id}`); return ok(undefined); } };
  const unlikeRecipe = { execute: async (id: string) => { calls.push(`unlike:${id}`); return ok(undefined); } };
  const likedRecipesStore = {
    getState: () => ({ removeLocal: (id: string) => calls.push(`removeLocal:${id}`) }),
  };
  return configureLikesStore({
    likeRecipe: likeRecipe as unknown as LikeRecipeUseCase,
    unlikeRecipe: unlikeRecipe as unknown as UnlikeRecipeUseCase,
    likedRecipesStore: likedRecipesStore as unknown as BoundStore<LikedRecipesStoreState>,
  });
};

describe('setLiked, against the real store', () => {
  it('likes a recipe the feed seeded as not liked', async () => {
    const calls: string[] = [];
    const store = build(calls);
    store.getState().seed('r1', 4, false);

    const result = await store.getState().setLiked('r1', true);

    expect(result.ok).toBe(true);
    expect(calls).toContain('like:r1');
    expect(store.getState().byRecipe.r1?.likedByMe).toBe(true);
    expect(store.getState().byRecipe.r1?.likeCount).toBe(5);
  });

  it('unlikes one the feed seeded as liked, and drops it from the Liked grid', async () => {
    const calls: string[] = [];
    const store = build(calls);
    store.getState().seed('r1', 1, true);

    const result = await store.getState().setLiked('r1', false);

    expect(result.ok).toBe(true);
    expect(calls).toContain('unlike:r1');
    expect(calls).toContain('removeLocal:r1');
    expect(store.getState().byRecipe.r1?.likedByMe).toBe(false);
    expect(store.getState().byRecipe.r1?.likeCount).toBe(0);
  });

  // The reported shape: the assistant says done and the heart does not move.
  it('does NOT report success for a recipe it has never seen', async () => {
    const store = build([]);

    const result = await store.getState().setLiked('never-seeded', false);

    expect(result.ok).toBe(false);
  });

  it('does not act twice while a toggle is still in flight', async () => {
    const calls: string[] = [];
    const store = build(calls);
    store.getState().seed('r1', 1, true);

    const first = store.getState().setLiked('r1', false);
    const second = await store.getState().setLiked('r1', false);

    expect(second.ok).toBe(false);
    await first;
    expect(calls.filter((c) => c.startsWith('unlike')).length).toBe(1);
  });
});
