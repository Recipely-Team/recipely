import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import type { RecipesListDto } from '@infrastructure/recipes/dtos/recipes-list-dto';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validDto: RecipeListItemDto = {
  id: '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234',
  name: 'Trending Spicy Pasta',
  image: 'https://cdn.recipely.io/recipe-images/trending-1.webp',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  totalTimeMinutes: 15,
  rating: 4.2,
  moderationStatus: 'approved',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  viewCount: 0,
};

const makeList = (items: RecipeListItemDto[]): RecipesListDto => ({
  items,
  total: items.length,
  page: 1,
  pageSize: items.length,
});

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}

// Minimal HttpClient stub — only `request` is used by listTrendingRecipes.
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

describe('RecipeRepository.listTrendingRecipes', () => {
  it('calls http.request with GET /recipes/trending and the default limit of 10 when omitted', async () => {
    const { http, calls } = makeHttp(ok(makeList([validDto])));
    const repo = new RecipeRepository(http);

    await repo.listTrendingRecipes();

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/recipes/trending');
    expect(calls[0].params).toEqual({ limit: 10 });
  });

  it('forwards an explicit limit as the limit query param', async () => {
    const { http, calls } = makeHttp(ok(makeList([validDto])));
    const repo = new RecipeRepository(http);

    await repo.listTrendingRecipes(3);

    expect(calls[0].params).toEqual({ limit: 3 });
  });

  it('maps every item in the list envelope into a RecipeSummaryEntity[]', async () => {
    const second: RecipeListItemDto = { ...validDto, id: 'second-id', name: 'Trending Tacos' };
    const { http } = makeHttp(ok(makeList([validDto, second])));
    const repo = new RecipeRepository(http);

    const r = await repo.listTrendingRecipes();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toHaveLength(2);
      expect(r.value[0]).toBeInstanceOf(RecipeSummaryEntity);
      expect(r.value[0].id).toBe(validDto.id);
      expect(r.value[0].name).toBe('Trending Spicy Pasta');
      expect(r.value[1].id).toBe('second-id');
      expect(r.value[1].name).toBe('Trending Tacos');
    }
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeRepository(http);

    const r = await repo.listTrendingRecipes();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('returns the validation failure from toRecipeSummary when a DTO is malformed (e.g. empty name)', async () => {
    const malformed: RecipeListItemDto = { ...validDto, id: 'bad-id', name: '' };
    const { http } = makeHttp(ok(makeList([validDto, malformed])));
    const repo = new RecipeRepository(http);

    const r = await repo.listTrendingRecipes();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.code).toBe('validation');
  });
});
