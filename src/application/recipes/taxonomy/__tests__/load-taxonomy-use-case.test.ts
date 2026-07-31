import { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { TaxonomyRepositoryInterface } from '@domain/recipes/taxonomy/taxonomy-repository-interface';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';

const cuisines: TaxonomyItem[] = [{ key: 'TURKISH', name: 'Turkish', emoji: '🥙' }];
const categories: TaxonomyItem[] = [{ key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' }];

const makeRepo = (overrides: Partial<TaxonomyRepositoryInterface> = {}): TaxonomyRepositoryInterface => ({
  listCuisines: jest.fn().mockResolvedValue(ok(cuisines)),
  listCategories: jest.fn().mockResolvedValue(ok(categories)),
  ...overrides,
});

describe('LoadTaxonomyUseCase', () => {
  it('combines both catalogs when both requests succeed', async () => {
    const repo = makeRepo();
    const result = await new LoadTaxonomyUseCase(repo).execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ cuisines, categories });
    }
  });

  it('loads the two catalogs in parallel', async () => {
    const repo = makeRepo();
    await new LoadTaxonomyUseCase(repo).execute();

    expect(repo.listCuisines).toHaveBeenCalledTimes(1);
    expect(repo.listCategories).toHaveBeenCalledTimes(1);
  });

  it('fails fast with the cuisine failure when cuisines fail', async () => {
    const failure = new NetworkFailure('offline');
    const repo = makeRepo({ listCuisines: jest.fn().mockResolvedValue(fail(failure)) });

    const result = await new LoadTaxonomyUseCase(repo).execute();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });

  it('returns the category failure when only categories fail', async () => {
    const failure = new NetworkFailure('offline');
    const repo = makeRepo({ listCategories: jest.fn().mockResolvedValue(fail(failure)) });

    const result = await new LoadTaxonomyUseCase(repo).execute();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });
});
