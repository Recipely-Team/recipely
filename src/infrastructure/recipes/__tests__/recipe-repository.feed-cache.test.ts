/**
 * The symptom: the recipe feed opened on "This took a while" whenever the API
 * was briefly unreachable, even though the app had shown that feed minutes ago.
 * The first page of a query is kept; a timeout or a dropped connection on the
 * same query answers from it. An answer the API gave (an error status) never does.
 */
import { NetworkFailure, NotFoundFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { FeedFirstPageCache } from '@infrastructure/recipes/list/feed-first-page-cache';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';

const memoryStore = (): KeyValueStoreInterface => {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => ok(values.get(key) ?? null),
    setItem: async (key, value) => {
      values.set(key, value);
      return ok(undefined);
    },
    removeItem: async (key) => {
      values.delete(key);
      return ok(undefined);
    },
  };
};

const FIRST_PAGE = { items: [], total: 7, page: 1, pageSize: 20, hasMore: false };

const repoAnswering = (...answers: Result<unknown, Failure>[]) => {
  const queue = [...answers];
  const http = withHttpVerbs(jest.fn(() => Promise.resolve(queue.shift())));
  return new RecipeRepository(http, new FeedFirstPageCache(memoryStore()));
};

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('RecipeRepository.listActiveRecipes — the last first page', () => {
  it('opens on the last feed when the API cannot be reached', async () => {
    const repo = repoAnswering(ok(FIRST_PAGE), fail(new NetworkFailure('offline')));
    await repo.listActiveRecipes();
    await flush();

    const second = await repo.listActiveRecipes();

    expect(second.ok && second.value.total).toBe(7);
  });

  it('passes on an answer the API gave', async () => {
    const repo = repoAnswering(ok(FIRST_PAGE), fail(new NotFoundFailure('gone')));
    await repo.listActiveRecipes();
    await flush();

    const second = await repo.listActiveRecipes();

    expect(second.ok).toBe(false);
  });

  it('never answers a different query from it', async () => {
    const repo = repoAnswering(ok(FIRST_PAGE), fail(new NetworkFailure('offline')));
    await repo.listActiveRecipes();
    await flush();

    const filtered = await repo.listActiveRecipes({ search: 'soup' });

    expect(filtered.ok).toBe(false);
  });
});
