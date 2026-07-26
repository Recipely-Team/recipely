import { configureRecipeListStore } from '@application/recipes/list/configure-recipe-list-store';
import type { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
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

const makeDeferred = (): {
  promise: Promise<Result<RecipeSummaryEntity[], Failure>>;
  resolve: (r: Result<RecipeSummaryEntity[], Failure>) => void;
} => {
  let resolve: (r: Result<RecipeSummaryEntity[], Failure>) => void = () => {};
  const promise = new Promise<Result<RecipeSummaryEntity[], Failure>>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('recipe-list-store', () => {
  it('starts in the idle state', () => {
    const useCase = { execute: jest.fn().mockResolvedValue(ok([])) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    expect(store.getState().state).toEqual({ status: 'idle' });
  });

  it('the first load from idle transitions to a bare loading state', async () => {
    const deferred = makeDeferred();
    const useCase = { execute: jest.fn().mockReturnValue(deferred.promise) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    const inFlight = store.getState().load();
    expect(store.getState().state).toEqual({ status: 'loading' });

    deferred.resolve(ok([makeRecipe()]));
    await inFlight;

    expect(store.getState().state).toEqual({ status: 'loaded', recipes: [makeRecipe()] });
  });

  it('a failed first load transitions to the error state', async () => {
    const failure = new NetworkFailure('offline');
    const useCase = { execute: jest.fn().mockResolvedValue(fail(failure)) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    await store.getState().load();

    expect(store.getState().state).toEqual({ status: 'error', failure });
  });

  it('a second load while already loaded keeps the previous recipes visible and marks isRefreshing', async () => {
    const first = [makeRecipe({ id: 'r1' })];
    const useCase = { execute: jest.fn().mockResolvedValue(ok(first)) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    await store.getState().load();
    expect(store.getState().state).toEqual({ status: 'loaded', recipes: first });

    const deferred = makeDeferred();
    useCase.execute.mockReturnValue(deferred.promise);

    const inFlight = store.getState().load({ cuisines: [CuisineKey.Turkish] });
    expect(store.getState().state).toEqual({
      status: 'loaded',
      recipes: first,
      isRefreshing: true,
      refreshFailure: undefined,
    });

    const second = [makeRecipe({ id: 'r2' })];
    deferred.resolve(ok(second));
    await inFlight;

    expect(store.getState().state).toEqual({ status: 'loaded', recipes: second });
  });

  it('a failed refresh keeps the previous recipes and surfaces refreshFailure instead of blanking the screen', async () => {
    const first = [makeRecipe({ id: 'r1' })];
    const useCase = { execute: jest.fn().mockResolvedValue(ok(first)) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    await store.getState().load();
    expect(store.getState().state).toEqual({ status: 'loaded', recipes: first });

    const failure = new NetworkFailure('offline');
    useCase.execute.mockResolvedValue(fail(failure));

    await store.getState().load({ cuisines: [CuisineKey.Turkish] });

    expect(store.getState().state).toEqual({
      status: 'loaded',
      recipes: first,
      isRefreshing: false,
      refreshFailure: failure,
    });
  });

  it('a subsequent successful load after a failed refresh clears refreshFailure', async () => {
    const first = [makeRecipe({ id: 'r1' })];
    const useCase = { execute: jest.fn().mockResolvedValue(ok(first)) };
    const store = configureRecipeListStore({ listRecipes: useCase as unknown as ListRecipesUseCase });

    await store.getState().load();

    const failure = new NetworkFailure('offline');
    useCase.execute.mockResolvedValueOnce(fail(failure));
    await store.getState().load({ cuisines: [CuisineKey.Turkish] });
    expect(store.getState().state).toMatchObject({ refreshFailure: failure });

    const second = [makeRecipe({ id: 'r2' })];
    useCase.execute.mockResolvedValueOnce(ok(second));
    await store.getState().load({ cuisines: [CuisineKey.Italian] });

    expect(store.getState().state).toEqual({ status: 'loaded', recipes: second });
  });
});
