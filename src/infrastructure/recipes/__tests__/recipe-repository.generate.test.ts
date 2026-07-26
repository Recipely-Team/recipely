import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validDto: RecipeDto = {
  id: '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234',
  name: 'AI Spicy Pasta',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: ['Pasta', 'Chili'],
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

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
  timeout?: number;
}

// Minimal HttpClient stub — only `request` is used by generateRecipe.
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

describe('RecipeRepository.generateRecipe', () => {
  it('returns ok(Recipe) when the HTTP call succeeds with a valid RecipeDto', async () => {
    const { http } = makeHttp(ok(validDto));
    const repo = new RecipeRepository(http);

    const r = await repo.generateRecipe('spicy pasta');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(RecipeEntity);
      expect(r.value.id).toBe(validDto.id);
      expect(r.value.name).toBe('AI Spicy Pasta');
      expect(r.value.cuisine).toBe(CuisineKey.Italian);
      expect(r.value.media).toEqual([
        { type: 'image', url: validDto.image },
      ]);
    }
  });

  it('calls http.request with POST /recipes/generate and { prompt } body (locale stays out of the body)', async () => {
    const { http, calls } = makeHttp(ok(validDto));
    const repo = new RecipeRepository(http);

    await repo.generateRecipe('spicy pasta');

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/recipes/generate');
    expect(calls[0].data).toEqual({ prompt: 'spicy pasta' });
    // The synchronous Gemini call routinely exceeds the default 10s JSON
    // timeout, so a per-request override is required or the client would abort
    // a request the backend then completes.
    expect(calls[0].timeout).toBe(AI_REQUEST_TIMEOUT_MS);
    // Locale is carried by the Accept-Language header (set by HttpClient),
    // never by the request body — guard against accidental regression.
    expect(JSON.stringify(calls[0].data)).not.toContain('tr');
    expect(JSON.stringify(calls[0].data)).not.toContain('locale');
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeRepository(http);

    const r = await repo.generateRecipe('pizza');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('returns the validation failure from toRecipe when the DTO is malformed (e.g. empty name)', async () => {
    const malformed: RecipeDto = { ...validDto, name: '' };
    const { http } = makeHttp(ok(malformed));
    const repo = new RecipeRepository(http);

    const r = await repo.generateRecipe('pizza');

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.code).toBe('validation');
    }
  });
});
