import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';
import { NetworkFailure } from '@core/failure';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id: 'r1',
    name: 'Stub Recipe',
    image: 'https://cdn.example.com/r1.webp',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

describe('isRecipeListRefreshing', () => {
  it('is false for idle', () => {
    expect(isRecipeListRefreshing({ status: 'idle' })).toBe(false);
  });

  it('is false for loading', () => {
    expect(isRecipeListRefreshing({ status: 'loading' })).toBe(false);
  });

  it('is false for error', () => {
    expect(isRecipeListRefreshing({ status: 'error', failure: new NetworkFailure('offline') })).toBe(
      false,
    );
  });

  it('is false when loaded with no in-flight refresh', () => {
    expect(isRecipeListRefreshing({ status: 'loaded', recipes: [makeRecipe()] })).toBe(false);
  });

  it('is false when loaded and isRefreshing is explicitly false', () => {
    expect(
      isRecipeListRefreshing({ status: 'loaded', recipes: [makeRecipe()], isRefreshing: false }),
    ).toBe(false);
  });

  it('is true when loaded and a filter/sort refetch is in flight', () => {
    expect(
      isRecipeListRefreshing({ status: 'loaded', recipes: [makeRecipe()], isRefreshing: true }),
    ).toBe(true);
  });

  it('is false when loaded and the refetch already failed (isRefreshing reset)', () => {
    const state: RecipeListState = {
      status: 'loaded',
      recipes: [makeRecipe()],
      isRefreshing: false,
      refreshFailure: new NetworkFailure('offline'),
    };
    expect(isRecipeListRefreshing(state)).toBe(false);
  });
});
