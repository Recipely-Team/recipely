import { configureTrendingRecipesStore } from '@application/recipes/trending/configure-trending-recipes-store';
import type { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (
  overrides: Partial<Parameters<typeof RecipeSummaryEntity.create>[0]> = {},
): RecipeSummaryEntity => {
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
    ...overrides,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const makeUseCase = (
  result: Result<RecipeSummaryEntity[], Failure>,
): { execute: jest.Mock } => ({
  execute: jest.fn().mockResolvedValue(result),
});

describe('trending-recipes-store', () => {
  it('starts in the idle state', () => {
    const useCase = makeUseCase(ok([]));
    const store = configureTrendingRecipesStore({
      listTrendingRecipes: useCase as unknown as ListTrendingRecipesUseCase,
    });

    expect(store.getState().state).toEqual({ status: 'idle' });
  });

  it('transitions through loading to loaded with the recipes on success', async () => {
    const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })];
    let resolve: (r: Result<RecipeSummaryEntity[], Failure>) => void = () => {};
    const pending = new Promise<Result<RecipeSummaryEntity[], Failure>>((r) => {
      resolve = r;
    });
    const useCase = { execute: jest.fn().mockReturnValue(pending) };
    const store = configureTrendingRecipesStore({
      listTrendingRecipes: useCase as unknown as ListTrendingRecipesUseCase,
    });

    const inFlight = store.getState().load();
    expect(store.getState().state).toEqual({ status: 'loading' });

    resolve(ok(recipes));
    await inFlight;

    expect(store.getState().state).toEqual({ status: 'loaded', recipes });
  });

  it('transitions to error with the failure on repository failure', async () => {
    const failure = new NetworkFailure('offline');
    const useCase = makeUseCase(fail(failure));
    const store = configureTrendingRecipesStore({
      listTrendingRecipes: useCase as unknown as ListTrendingRecipesUseCase,
    });

    await store.getState().load();

    expect(store.getState().state).toEqual({ status: 'error', failure });
  });

  it('forwards the limit argument to the use case', async () => {
    const useCase = makeUseCase(ok([]));
    const store = configureTrendingRecipesStore({
      listTrendingRecipes: useCase as unknown as ListTrendingRecipesUseCase,
    });

    await store.getState().load(6);

    expect(useCase.execute).toHaveBeenCalledWith(6);
  });
});
