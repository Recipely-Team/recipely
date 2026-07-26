import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RefineRecipeResponseDto } from '@infrastructure/recipes/refine/refine-recipe-response-dto';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validDto: RecipeDto = {
  id: '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234',
  name: 'Refined Spicy Pasta',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: ['Pasta', 'Chili', 'Garlic'],
  instructions: ['Boil', 'Toss'],
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  caloriesPerServing: 450,
  image: 'https://cdn.recipely.io/recipe-images/ai-1.webp',
  rating: 4.2,
  tags: ['AI', 'Quick'],
  mealType: ['Dinner'],
  ownerId: 'owner-7',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  viewCount: 0,
  moderationStatus: 'approved',
  createdAt: '2026-05-11T12:00:00.000Z',
  updatedAt: '2026-05-11T12:00:00.000Z',
};

const snapshot: DraftRecipeSnapshot = {
  name: 'Spicy Pasta',
  cuisine: CuisineKey.Italian,
  ingredients: ['Pasta', 'Chili'],
  instructions: ['Boil'],
};

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
  timeout?: number;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const stub = {
    request: jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(result);
    }),
  } as unknown as HttpClient;
  return { http: stub, calls };
};

// The wire response flattens the AI commentary on top of the recipe DTO fields.
const refinedDto: RefineRecipeResponseDto = {
  ...validDto,
  summary: 'Doubled the garlic and added chili flakes.',
  suggestion: 'A splash of pasta water binds the sauce.',
};

describe('RecipeRepository.refineRecipe', () => {
  it('returns ok(RefinedRecipe) with the mapped Recipe and the flattened summary/suggestion', async () => {
    const { http } = makeHttp(ok(refinedDto));
    const repo = new RecipeRepository(http);

    const r = await repo.refineRecipe(snapshot, 'add more garlic');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.recipe).toBeInstanceOf(RecipeEntity);
      expect(r.value.recipe.name).toBe('Refined Spicy Pasta');
      expect(r.value.recipe.cuisine).toBe(CuisineKey.Italian);
      expect(r.value.summary).toBe('Doubled the garlic and added chili flakes.');
      expect(r.value.suggestion).toBe('A splash of pasta water binds the sauce.');
    }
  });

  // An older backend answers with the bare RecipeDto — no summary/suggestion
  // keys at all. The recipe must still map; the commentary is simply absent.
  it('maps a response without summary/suggestion (older backend) to undefined fields', async () => {
    const { http } = makeHttp(ok(validDto));
    const repo = new RecipeRepository(http);

    const r = await repo.refineRecipe(snapshot, 'add more garlic');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.recipe).toBeInstanceOf(RecipeEntity);
      expect(r.value.recipe.name).toBe('Refined Spicy Pasta');
      expect(r.value.summary).toBeUndefined();
      expect(r.value.suggestion).toBeUndefined();
    }
  });

  it('POSTs /recipes/refine with { currentRecipe, instruction } body', async () => {
    const { http, calls } = makeHttp(ok(validDto));
    const repo = new RecipeRepository(http);

    await repo.refineRecipe(snapshot, 'add more garlic');

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/recipes/refine');
    expect(calls[0].data).toEqual({
      currentRecipe: snapshot,
      instruction: 'add more garlic',
    });
    // The synchronous Gemini call routinely exceeds the default 10s JSON
    // timeout, so a per-request override is required or the client would abort
    // a request the backend then completes.
    expect(calls[0].timeout).toBe(AI_REQUEST_TIMEOUT_MS);
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeRepository(http);

    const r = await repo.refineRecipe(snapshot, 'add garlic');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('returns the validation failure from toRecipe when the DTO is malformed', async () => {
    const malformed: RecipeDto = { ...validDto, name: '' };
    const { http } = makeHttp(ok(malformed));
    const repo = new RecipeRepository(http);

    const r = await repo.refineRecipe(snapshot, 'add garlic');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.code).toBe('validation');
  });
});
