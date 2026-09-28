import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import type { RecordedRequest } from '@infrastructure/network/http/__fixtures__/recorded-request';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';
import { PublishBlocker } from '@domain/recipes/publishing/publish-blocker';

const RECIPE_ID = 'recipe-1';

const dto: RecipeDto = {
  id: RECIPE_ID,
  name: 'Menemen',
  cuisine: 'TURKISH',
  category: 'BREAKFAST',
  difficulty: 'EASY',
  ingredients: ['2 eggs'],
  instructions: ['Cook'],
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  caloriesPerServing: 200,
  image: '',
  rating: 0,
  tags: [],
  mealType: [],
  ownerId: 'owner-1',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  viewCount: 0,
  isPublished: false,
  moderationStatus: 'unreviewed',
  publishBlockers: ['photo', 'instructions'],
};

const makeRepo = (result: Result<unknown, unknown>) => {
  const calls: RecordedRequest[] = [];
  const http = withHttpVerbs(async (config) => {
    calls.push(config);
    return result;
  });
  return { repo: new RecipeRepository(http), calls };
};

describe('RecipeRepository — save first, publish later', () => {
  it('edits a private recipe with PATCH /recipes/:id and only the fields given', async () => {
    const { repo, calls } = makeRepo(ok(dto));
    const input = { name: { tr: 'Menemen' }, servings: 3 };

    const result = await repo.updateRecipe(RECIPE_ID, input);

    expect(result.ok).toBe(true);
    expect(calls[0]).toMatchObject({ method: 'PATCH', url: `/recipes/${RECIPE_ID}`, data: input });
  });

  it('reads the owner-only blockers off the detail payload', async () => {
    const { repo } = makeRepo(ok(dto));

    const result = await repo.getRecipe(RECIPE_ID);

    expect(result.ok && result.value.publishBlockers).toEqual([
      PublishBlocker.Photo,
      PublishBlocker.Instructions,
    ]);
    expect(result.ok && result.value.ownerStatus).toBe(OwnerStatus.Private);
  });

  it('publishes with POST /recipes/:id/publish and returns the moderator answer', async () => {
    const { repo, calls } = makeRepo(ok({ isPublished: false, moderationStatus: 'pending' }));

    const result = await repo.publishRecipe(RECIPE_ID);

    expect(calls[0]).toMatchObject({ method: 'POST', url: `/recipes/${RECIPE_ID}/publish` });
    expect(result.ok && result.value).toEqual({ isPublished: false, moderationStatus: 'pending' });
  });

  it('unpublishes with POST /recipes/:id/unpublish', async () => {
    const { repo, calls } = makeRepo(ok({ isPublished: false, moderationStatus: 'unreviewed' }));

    await repo.unpublishRecipe(RECIPE_ID);

    expect(calls[0]).toMatchObject({ method: 'POST', url: `/recipes/${RECIPE_ID}/unpublish` });
  });

  it('removes the cover with DELETE /recipes/:id/cover', async () => {
    const { repo, calls } = makeRepo(ok({ image: 'https://x.test/next.jpg', removedMediaIds: ['m1'] }));

    const result = await repo.removeRecipeCover(RECIPE_ID);

    expect(calls[0]).toMatchObject({ method: 'DELETE', url: `/recipes/${RECIPE_ID}/cover` });
    expect(result.ok && result.value).toEqual({ image: 'https://x.test/next.jpg', removedMediaIds: ['m1'] });
  });
});
