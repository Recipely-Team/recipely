import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FavoritesRepository } from '@infrastructure/favorites/favorites-repository';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const recipe = (id: string, name: string): RecipeListItemDto => ({
  id, name, image: '', cuisine: CuisineKey.Italian, category: RecipeCategory.Dinner, difficulty: Difficulty.Easy,
  totalTimeMinutes: 15, rating: 4, moderationStatus: 'approved', likeCount: 0, likedByMe: false, commentCount: 0, viewCount: 0,
});

const httpAnswering = (answer: unknown) => {
  const http = { post: jest.fn().mockResolvedValue(answer), delete: jest.fn().mockResolvedValue(answer), get: jest.fn().mockResolvedValue(answer) };
  return { repo: new FavoritesRepository(http as unknown as AxiosHttpClient), http };
};

describe('FavoritesRepository', () => {
  it('posts and deletes the recipe\'s favorite route', async () => {
    const { repo, http } = httpAnswering(ok(undefined));
    expect((await repo.addFavorite('r 1')).ok).toBe(true);
    expect((await repo.removeFavorite('r 1')).ok).toBe(true);
    expect(http.post).toHaveBeenCalledWith(ApiRoutes.recipes.favorite('r 1'), undefined);
    expect(http.delete).toHaveBeenCalledWith(ApiRoutes.recipes.favorite('r 1'));
  });

  it('lists favorites as summaries from the paged envelope', async () => {
    const { repo, http } = httpAnswering(ok({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }));
    const result = await repo.listFavorites();
    expect(result.ok && result.value.items).toEqual([]);
    expect(http.get).toHaveBeenCalledWith(ApiRoutes.me.favorites, expect.objectContaining({ params: expect.any(Object) }));
  });

  // The symptom: one saved recipe with a blank name emptied Saved, and its tab lost its count.
  it('keeps the readable saves and the server total when one row cannot be read', async () => {
    const { repo } = httpAnswering(ok({ items: [recipe('a', 'Soup'), recipe('b', ''), recipe('c', 'Kek')], total: 3, page: 1, pageSize: 100 }));
    const result = await repo.listFavorites();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items.map((r) => r.id)).toEqual(['a', 'c']);
      expect(result.value.total).toBe(3);
    }
  });

  it('passes HTTP failures through', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = httpAnswering(fail(failure));
    expect(await repo.addFavorite('r1')).toEqual(fail(failure));
    expect(await repo.removeFavorite('r1')).toEqual(fail(failure));
    expect(await repo.listFavorites()).toEqual(fail(failure));
  });
});
