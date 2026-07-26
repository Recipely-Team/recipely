import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { TaxonomyItemDto } from '@infrastructure/recipes/taxonomy/dtos/taxonomy-item-dto';
import { TaxonomyRepository } from '@infrastructure/recipes/taxonomy/taxonomy-repository';

const turkish: TaxonomyItemDto = { key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' };
const italian: TaxonomyItemDto = { key: 'ITALIAN', name: 'Italian', emoji: '🇮🇹' };
const breakfast: TaxonomyItemDto = { key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' };

interface RequestCall {
  method?: string;
  url?: string;
}

// Minimal HttpClient stub — only `request` is used by the repository.
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

describe('TaxonomyRepository.listCuisines', () => {
  it('returns mapped items from the { cuisines } payload on success', async () => {
    const { http } = makeHttp(ok({ cuisines: [turkish, italian] }));
    const repo = new TaxonomyRepository(http);

    const r = await repo.listCuisines();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual([
        { key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' },
        { key: 'ITALIAN', name: 'Italian', emoji: '🇮🇹' },
      ]);
    }
  });

  it('calls http.request with GET on the cuisines path', async () => {
    const { http, calls } = makeHttp(ok({ cuisines: [] }));
    const repo = new TaxonomyRepository(http);

    await repo.listCuisines();

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(ApiRoutes.recipes.cuisines);
  });

  it('drops malformed rows before returning (mapper is applied)', async () => {
    const { http } = makeHttp(
      ok({ cuisines: [turkish, { key: '', name: 'x', emoji: 'y' }, italian] }),
    );
    const repo = new TaxonomyRepository(http);

    const r = await repo.listCuisines();

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.map((i) => i.key)).toEqual(['TURKISH', 'ITALIAN']);
  });

  it('propagates the HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new TaxonomyRepository(http);

    const r = await repo.listCuisines();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('TaxonomyRepository.listCategories', () => {
  it('returns mapped items from the { categories } payload on success', async () => {
    const { http } = makeHttp(ok({ categories: [breakfast] }));
    const repo = new TaxonomyRepository(http);

    const r = await repo.listCategories();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual([
        { key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' },
      ]);
    }
  });

  it('calls http.request with GET on the categories path', async () => {
    const { http, calls } = makeHttp(ok({ categories: [] }));
    const repo = new TaxonomyRepository(http);

    await repo.listCategories();

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(ApiRoutes.recipes.categories);
  });

  it('propagates the HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new TaxonomyRepository(http);

    const r = await repo.listCategories();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
