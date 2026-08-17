/**
 * Taking the heart off a recipe has to take it out of the Liked grid.
 *
 * Without this the user unliked a recipe on its detail screen, went back to My
 * Recipes, and found it still sitting under "Liked" with no way to tell whether
 * the unlike had worked — the same stale-row problem the saved grid had before
 * `removeLocal`.
 */

import { configureLikesStore } from '@application/likes/likes-store';
import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';
import type { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import type { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { BoundStore } from '@application/store/bound-store';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const RECIPE_ID = 'r-1';

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 1,
    likedByMe: true,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const makeLikedStore = async (): Promise<BoundStore<LikedRecipesStoreState>> => {
  const store = configureLikedRecipesStore({
    loadLikedRecipesUseCase: {
      execute: () => Promise.resolve(ok([makeRecipe(RECIPE_ID), makeRecipe('r-2')])),
    } as LoadLikedRecipesUseCase,
  });
  await store.getState().loadLiked();
  return store;
};

const makeLikesStore = (
  likedRecipesStore: BoundStore<LikedRecipesStoreState>,
  unlikeResult: Result<void, Failure> = ok(undefined),
) =>
  configureLikesStore({
    likeRecipe: { execute: () => Promise.resolve(ok(undefined)) } as unknown as LikeRecipeUseCase,
    unlikeRecipe: { execute: () => Promise.resolve(unlikeResult) } as unknown as UnlikeRecipeUseCase,
    likedRecipesStore,
  });

describe('likesStore.toggle — the Liked grid', () => {
  it('drops the row when the recipe is unliked', async () => {
    const likedRecipesStore = await makeLikedStore();
    const likes = makeLikesStore(likedRecipesStore);
    likes.getState().seed(RECIPE_ID, 1, true);

    await likes.getState().toggle(RECIPE_ID);

    expect(likedRecipesStore.getState().likedRecipes.map((r) => r.id)).toEqual(['r-2']);
  });

  it('keeps the row when the unlike request fails and the toggle rolls back', async () => {
    const likedRecipesStore = await makeLikedStore();
    const likes = makeLikesStore(likedRecipesStore, fail(new NetworkFailure('offline')));
    likes.getState().seed(RECIPE_ID, 1, true);

    await likes.getState().toggle(RECIPE_ID);

    expect(likedRecipesStore.getState().likedRecipes.map((r) => r.id)).toEqual([RECIPE_ID, 'r-2']);
    expect(likes.getState().byRecipe[RECIPE_ID]?.likedByMe).toBe(true);
  });

  it('leaves the grid alone when the recipe is LIKED — the next load fetches it in like order', async () => {
    const likedRecipesStore = await makeLikedStore();
    const likes = makeLikesStore(likedRecipesStore);
    likes.getState().seed('r-3', 0, false);

    await likes.getState().toggle('r-3');

    expect(likedRecipesStore.getState().likedRecipes.map((r) => r.id)).toEqual([RECIPE_ID, 'r-2']);
  });
});
