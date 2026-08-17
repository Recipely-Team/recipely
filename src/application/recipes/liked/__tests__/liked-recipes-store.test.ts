/**
 * The "Liked" tab renders this store. Two things it must get right are things
 * the saved grid had to learn the hard way:
 *   - an unanswered load is not an empty list (the cold-open flash of "you have
 *     liked nothing"),
 *   - a load that started under a previous session must not publish its answer
 *     after a sign-out.
 */

import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { StoreStatus } from '@application/store/store-status';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

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

const useCaseReturning = (execute: LoadLikedRecipesUseCase['execute']): LoadLikedRecipesUseCase =>
  ({ execute }) as LoadLikedRecipesUseCase;

describe('likedRecipesStore.loadLiked', () => {
  it('starts idle so an empty grid can be told from an unanswered one', () => {
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() => Promise.resolve(ok([]))),
    });

    expect(store.getState().listState.status).toBe(StoreStatus.Idle);
    expect(store.getState().likedRecipes).toEqual([]);
  });

  it('publishes the rows and marks the load loaded', async () => {
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() => Promise.resolve(ok([makeRecipe('r1')]))),
    });

    await store.getState().loadLiked();

    expect(store.getState().likedRecipes.map((r) => r.id)).toEqual(['r1']);
    expect(store.getState().listState.status).toBe(StoreStatus.Loaded);
  });

  it('keeps the rows on screen when a RELOAD fails', async () => {
    let attempt = 0;
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() => {
        attempt += 1;
        return Promise.resolve(attempt === 1 ? ok([makeRecipe('r1')]) : fail(new NetworkFailure('offline')));
      }),
    });

    await store.getState().loadLiked();
    await store.getState().loadLiked();

    expect(store.getState().listState.status).toBe(StoreStatus.Error);
    expect(store.getState().likedRecipes.map((r) => r.id)).toEqual(['r1']);
  });

  it('hands its own outcome back so an overlapping pull can toast the right answer', async () => {
    const failure = new NetworkFailure('offline');
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() => Promise.resolve(fail(failure))),
    });

    const result = await store.getState().loadLiked();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toBe(failure);
  });

  it('drops an answer that arrives after the session it was requested under ended', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(async () => {
        await gate;
        return ok([makeRecipe('r1')]);
      }),
    });

    const inFlight = store.getState().loadLiked();
    store.getState().clear();
    release?.();
    await inFlight;

    expect(store.getState().likedRecipes).toEqual([]);
    expect(store.getState().listState.status).toBe(StoreStatus.Idle);
  });
});

describe('likedRecipesStore.removeLocal', () => {
  it('takes the row out of the grid', async () => {
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() =>
        Promise.resolve(ok([makeRecipe('r1'), makeRecipe('r2')])),
      ),
    });
    await store.getState().loadLiked();

    store.getState().removeLocal('r1');

    expect(store.getState().likedRecipes.map((r) => r.id)).toEqual(['r2']);
  });

  it('leaves the rows untouched for an id it is not holding', async () => {
    const store = configureLikedRecipesStore({
      loadLikedRecipesUseCase: useCaseReturning(() => Promise.resolve(ok([makeRecipe('r1')]))),
    });
    await store.getState().loadLiked();
    const before = store.getState().likedRecipes;

    store.getState().removeLocal('r-unknown');

    expect(store.getState().likedRecipes).toBe(before);
  });
});
