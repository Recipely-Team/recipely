import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validDto: RecipeDto = {
  id: '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234',
  name: 'Spicy Pasta',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: ['Pasta', 'Chili'],
  instructions: ['Boil', 'Toss'],
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  caloriesPerServing: 450,
  image: 'https://cdn.recipely.io/recipe-images/1.webp',
  rating: 4.2,
  tags: ['Quick'],
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

// A minimal valid create input with no media so the FormData file-append path
// (Platform-specific) is skipped — this test only cares about the scalar fields.
const makeInput = (): CreateRecipeInput => ({
  name: { en: 'Spicy Pasta' },
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: { en: ['Pasta', 'Chili'] },
  instructions: { en: ['Boil', 'Toss'] },
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  servings: 4,
  media: [],
  isPublished: true,
});

interface UploadCall {
  url: string;
  formData: FormData;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: UploadCall[] } => {
  const calls: UploadCall[] = [];
  const stub = {
    uploadMultipart: jest.fn((url: string, formData: FormData) => {
      calls.push({ url, formData });
      return Promise.resolve(result);
    }),
  } as unknown as HttpClient;
  return { http: stub, calls };
};

describe('RecipeRepository.createRecipe', () => {
  it('uploads to /recipes/with-media and includes servings in the multipart body', async () => {
    const appends: [string, unknown][] = [];
    const spy = jest
      .spyOn(FormData.prototype, 'append')
      .mockImplementation((field: string, value: unknown) => {
        appends.push([field, value]);
      });
    try {
      const { http, calls } = makeHttp(ok(validDto));
      const repo = new RecipeRepository(http);

      const r = await repo.createRecipe(makeInput());

      expect(r.ok).toBe(true);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe('/recipes/with-media');

      const fields = new Map(appends);
      // Regression guard: servings was previously dropped on create (present on
      // update only), which the backend rejected with a 400 on publish.
      expect(fields.get('servings')).toBe('4');
      expect(fields.get('prepTimeMinutes')).toBe('15');
      expect(fields.get('cookTimeMinutes')).toBe('20');
      expect(fields.get('name')).toBe(JSON.stringify({ en: 'Spicy Pasta' }));
    } finally {
      spy.mockRestore();
    }
  });

  it('propagates an HttpClient upload failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeRepository(http);

    const r = await repo.createRecipe(makeInput());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('returns ok(Recipe) mapped from the response DTO', async () => {
    const { http } = makeHttp(ok(validDto));
    const repo = new RecipeRepository(http);

    const r = await repo.createRecipe(makeInput());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(RecipeEntity);
      expect(r.value.id).toBe(validDto.id);
    }
  });
});
