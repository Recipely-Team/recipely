import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import { ErrorMessageKey, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const snapshot: DraftRecipeSnapshot = {
  name: 'Spicy Pasta',
  ingredients: ['Pasta'],
  instructions: ['Boil'],
};

const makeRecipe = (): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Refined Recipe',
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
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

describe('RefineRecipeUseCase.execute', () => {
  it('returns the RefinedRecipe read model and forwards the trimmed instruction to the repo', async () => {
    const recipe = makeRecipe();
    const repo = new FakeRecipeRepository({
      refineRecipeResult: ok({ recipe, summary: 'Added garlic.', suggestion: 'Try basil too.' }),
    });
    const useCase = new RefineRecipeUseCase(repo);

    const r = await useCase.execute({ currentRecipe: snapshot, instruction: '  add garlic  ' });

    expect(repo.lastRefineCall).toEqual({ currentRecipe: snapshot, instruction: 'add garlic' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.recipe).toBe(recipe);
      expect(r.value.summary).toBe('Added garlic.');
      expect(r.value.suggestion).toBe('Try basil too.');
    }
  });

  // The use case must not "helpfully" default the commentary — absence is the
  // signal build-refine-reply keys its i18n fallback off.
  it('passes through a RefinedRecipe without summary or suggestion untouched', async () => {
    const recipe = makeRecipe();
    const repo = new FakeRecipeRepository({ refineRecipeResult: ok({ recipe }) });
    const useCase = new RefineRecipeUseCase(repo);

    const r = await useCase.execute({ currentRecipe: snapshot, instruction: 'add garlic' });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.recipe).toBe(recipe);
      expect(r.value.summary).toBeUndefined();
      expect(r.value.suggestion).toBeUndefined();
    }
  });

  // A blank refine instruction is NOT a blank prompt: a recipe already exists on
  // screen, so "describe the dish you want" is the wrong advice — the user is
  // being asked what to CHANGE. Hence refine's own key rather than promptRequired.
  it('returns ValidationFailure keyed errors.ai.refine_instruction_required for an empty instruction without calling the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new RefineRecipeUseCase(repo);

    const r = await useCase.execute({ currentRecipe: snapshot, instruction: '' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure).toBeInstanceOf(ValidationFailure);
      expect((r.failure as ValidationFailure).messageKey).toBe(
        ErrorMessageKey.refineInstructionRequired,
      );
    }
    expect(repo.refineCallCount).toBe(0);
  });

  it('returns ValidationFailure for a whitespace-only instruction without calling the repo', async () => {
    const repo = new FakeRecipeRepository();
    const useCase = new RefineRecipeUseCase(repo);

    const r = await useCase.execute({ currentRecipe: snapshot, instruction: '  \n\t ' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBeInstanceOf(ValidationFailure);
    expect(repo.refineCallCount).toBe(0);
  });

  it('propagates a repository failure unchanged', async () => {
    const failure = new UnknownFailure('AI provider crashed');
    const repo = new FakeRecipeRepository({ refineRecipeResult: fail(failure) });
    const useCase = new RefineRecipeUseCase(repo);

    const r = await useCase.execute({ currentRecipe: snapshot, instruction: 'add garlic' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
