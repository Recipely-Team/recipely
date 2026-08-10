import { configureTaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store';
import type { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import type { TaxonomyCatalog } from '@application/recipes/taxonomy/taxonomy-catalog';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

const catalog: TaxonomyCatalog = {
  cuisines: [{ key: 'TURKISH', name: 'Turkish', emoji: '🥙' }],
  categories: [{ key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' }],
};

const makeUseCase = (
  result: Result<TaxonomyCatalog, Failure>,
): { execute: jest.Mock } => ({
  execute: jest.fn().mockResolvedValue(result),
});

describe('taxonomy-store', () => {
  it('starts idle with empty catalogs', () => {
    const useCase = makeUseCase(ok(catalog));
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    const state = store.getState();
    expect(state.status).toBe('idle');
    expect(state.cuisines).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.failure).toBeNull();
  });

  it('populates catalogs and becomes ready on success', async () => {
    const useCase = makeUseCase(ok(catalog));
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    await store.getState().load();

    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.cuisines).toEqual(catalog.cuisines);
    expect(state.categories).toEqual(catalog.categories);
    expect(state.failure).toBeNull();
  });

  it('records the failure and becomes error on failure', async () => {
    const failure = new NetworkFailure('offline');
    const useCase = makeUseCase(fail(failure));
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    await store.getState().load();

    const state = store.getState();
    expect(state.status).toBe('error');
    expect(state.failure).toBe(failure);
    expect(state.cuisines).toEqual([]);
  });

  it('does not refetch once ready', async () => {
    const useCase = makeUseCase(ok(catalog));
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    await store.getState().load();
    await store.getState().load();

    expect(useCase.execute).toHaveBeenCalledTimes(1);
  });

  it('does not start a second load while one is in flight', async () => {
    let resolve: (r: Result<TaxonomyCatalog, Failure>) => void = () => {};
    const pending = new Promise<Result<TaxonomyCatalog, Failure>>((r) => {
      resolve = r;
    });
    const useCase = { execute: jest.fn().mockReturnValue(pending) };
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    const first = store.getState().load();
    await store.getState().load(); // no-op while loading
    expect(useCase.execute).toHaveBeenCalledTimes(1);

    resolve(ok(catalog));
    await first;
    expect(store.getState().status).toBe('ready');
  });
});

describe('taxonomy-store reload', () => {
  it('re-fetches the catalogs even when already ready', async () => {
    const useCase = makeUseCase(ok(catalog));
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    await store.getState().load();
    await store.getState().reload();

    expect(useCase.execute).toHaveBeenCalledTimes(2);
    expect(store.getState().status).toBe('ready');
  });

  it('is a no-op while a fetch is already in flight', async () => {
    let resolveFetch: (r: Result<TaxonomyCatalog, Failure>) => void = () => {};
    const useCase = {
      execute: jest.fn().mockReturnValue(
        new Promise<Result<TaxonomyCatalog, Failure>>((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    };
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    const first = store.getState().load();
    await store.getState().reload();
    expect(useCase.execute).toHaveBeenCalledTimes(1);

    resolveFetch(ok(catalog));
    await first;
    expect(store.getState().status).toBe('ready');
  });

  it('records the failure and becomes error when the re-fetch fails', async () => {
    const useCase = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(ok(catalog))
        .mockResolvedValueOnce(fail(new NetworkFailure('offline'))),
    };
    const store = configureTaxonomyStore({ loadTaxonomyUseCase: useCase as unknown as LoadTaxonomyUseCase });

    await store.getState().load();
    await store.getState().reload();

    expect(store.getState().status).toBe('error');
    expect(store.getState().failure).toBeInstanceOf(NetworkFailure);
  });
});
