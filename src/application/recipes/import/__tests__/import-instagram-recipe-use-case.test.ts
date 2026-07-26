import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import { ErrorMessageKey, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Imported Reel',
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

describe('ImportInstagramRecipeUseCase.execute', () => {
  it('returns ValidationFailure importInvalidUrl for an empty url without hitting the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: '' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.importInvalidUrl);
    }
    expect(repo.importInstagramCallCount).toBe(0);
  });

  it('returns ValidationFailure importInvalidUrl for a whitespace-only url without hitting the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: '   \n\t  ' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.importInvalidUrl);
    }
    expect(repo.importInstagramCallCount).toBe(0);
  });

  it('returns ValidationFailure importNotInstagram for a non-instagram host without hitting the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: 'https://tiktok.com/x' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.importNotInstagram);
    }
    expect(repo.importInstagramCallCount).toBe(0);
  });

  it('returns ValidationFailure importNotInstagram for a malformed/unparseable url without hitting the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: 'not a url' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(ErrorMessageKey.importNotInstagram);
    }
    expect(repo.importInstagramCallCount).toBe(0);
  });

  it('calls repo.importInstagramRecipe once with the trimmed url and locale for a www.instagram.com reel', async () => {
    const recipe = makeRecipe();
    const repo = new FakeRecipeRepository({ importInstagramRecipeResult: ok(recipe) });
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: '  https://www.instagram.com/reel/abc/  ' });

    expect(repo.importInstagramCallCount).toBe(1);
    expect(repo.lastImportInstagramCall).toEqual({
      url: 'https://www.instagram.com/reel/abc/',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(recipe);
  });

  it('accepts a bare instagram.com host and passes the repo result through on success', async () => {
    const recipe = makeRecipe({ id: 'r-import' });
    const repo = new FakeRecipeRepository({ importInstagramRecipeResult: ok(recipe) });
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: 'https://instagram.com/p/xyz' });

    expect(repo.importInstagramCallCount).toBe(1);
    expect(repo.lastImportInstagramCall).toEqual({
      url: 'https://instagram.com/p/xyz',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(recipe);
  });

  it('propagates a repository failure unchanged for a valid instagram url', async () => {
    const failure = new UnknownFailure('import pipeline crashed');
    const repo = new FakeRecipeRepository({ importInstagramRecipeResult: fail(failure) });
    const useCase = new ImportInstagramRecipeUseCase(repo);

    const r = await useCase.execute({ url: 'https://www.instagram.com/reel/abc/' });

    expect(repo.importInstagramCallCount).toBe(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
