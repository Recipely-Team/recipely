import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FavoritesRepository } from '@infrastructure/favorites/favorites-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';

const httpAnswering = (answer: unknown) => {
  const http = { post: jest.fn().mockResolvedValue(answer), delete: jest.fn().mockResolvedValue(answer), get: jest.fn().mockResolvedValue(answer) };
  return { repo: new FavoritesRepository(http as unknown as HttpClient), http };
};

describe('FavoritesRepository', () => {
  it('posts and deletes the recipe\'s favorite route', async () => {
    const { repo, http } = httpAnswering(ok(undefined));
    expect((await repo.addFavorite('u1', 'r 1')).ok).toBe(true);
    expect((await repo.removeFavorite('u1', 'r 1')).ok).toBe(true);
    expect(http.post).toHaveBeenCalledWith(ApiRoutes.recipes.favorite('r 1'), undefined);
    expect(http.delete).toHaveBeenCalledWith(ApiRoutes.recipes.favorite('r 1'));
  });

  it('lists favorites as summaries from the paged envelope', async () => {
    const { repo, http } = httpAnswering(ok({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }));
    const result = await repo.listFavorites();
    expect(result).toEqual(ok([]));
    expect(http.get).toHaveBeenCalledWith(ApiRoutes.me.favorites, expect.objectContaining({ params: expect.any(Object) }));
  });

  it('passes HTTP failures through', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = httpAnswering(fail(failure));
    expect(await repo.addFavorite('u1', 'r1')).toEqual(fail(failure));
    expect(await repo.removeFavorite('u1', 'r1')).toEqual(fail(failure));
    expect(await repo.listFavorites()).toEqual(fail(failure));
  });
});
