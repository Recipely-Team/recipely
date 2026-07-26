import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
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

describe('ListTrendingRecipesUseCase.execute', () => {
  it('returns ok with the trending recipes from the repository', async () => {
    const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })];
    const repo = new FakeRecipeRepository({ listTrendingRecipesResult: ok(recipes) });
    const useCase = new ListTrendingRecipesUseCase(repo);

    const r = await useCase.execute();

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(recipes);
  });

  it('passes the limit argument through to the repository', async () => {
    const recipes = [makeRecipe()];
    const repo = new FakeRecipeRepository({ listTrendingRecipesResult: ok(recipes) });
    const spy = jest.spyOn(repo, 'listTrendingRecipes');
    const useCase = new ListTrendingRecipesUseCase(repo);

    await useCase.execute(5);

    expect(spy).toHaveBeenCalledWith(5);
  });

  it('propagates failure from the repository', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new FakeRecipeRepository({ listTrendingRecipesResult: fail(failure) });
    const useCase = new ListTrendingRecipesUseCase(repo);

    const r = await useCase.execute();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
