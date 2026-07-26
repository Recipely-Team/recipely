import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import { ErrorMessageKey, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Stub Recipe',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['flour'],
    instructions: ['mix'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/r1.webp',
    media: [{ type: 'image', url: 'https://cdn.example.com/r1.webp' }],
    rating: 4.5,
    tags: ['quick'],
    mealType: ['Dinner'],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
    ...overrides,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

describe('GenerateRecipeUseCase.execute', () => {
  it('returns ValidationFailure keyed errors.validation.prompt_required when prompt is empty', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new GenerateRecipeUseCase(repo);

    const r = await useCase.execute({ prompt: '' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.promptRequired);
      expect((r.failure as ValidationFailure).code).toBe('validation');
    }
    expect(repo.generateCallCount).toBe(0);
  });

  it('returns ValidationFailure when prompt is whitespace-only', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new GenerateRecipeUseCase(repo);

    const r = await useCase.execute({ prompt: '   \n\t  ' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.promptRequired);
    }
    expect(repo.generateCallCount).toBe(0);
  });

  it('calls repo.generateRecipe with the trimmed prompt and the passed locale', async () => {
    const recipe = makeRecipe();
    const repo = new FakeRecipeRepository({ generateRecipeResult: ok(recipe) });
    const useCase = new GenerateRecipeUseCase(repo);

    const r = await useCase.execute({ prompt: '  spicy pasta  ' });

    expect(repo.lastGenerateCall).toEqual({ prompt: 'spicy pasta' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(recipe);
  });

  it('propagates failure from the repository', async () => {
    const failure = new UnknownFailure('AI provider crashed');
    const repo = new FakeRecipeRepository({ generateRecipeResult: fail(failure) });
    const useCase = new GenerateRecipeUseCase(repo);

    const r = await useCase.execute({ prompt: 'pizza' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
