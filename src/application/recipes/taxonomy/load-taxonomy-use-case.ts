import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { TaxonomyRepositoryInterface } from '@domain/recipes/taxonomy/taxonomy-repository-interface';
import type { TaxonomyCatalog } from '@application/recipes/taxonomy/taxonomy-catalog';

/**
 * Loads the cuisine and category catalogs in parallel and combines them. Fails
 * fast: if either request fails, the use case returns that failure and no
 * partial catalog is surfaced.
 */
export class LoadTaxonomyUseCase {
  constructor(private readonly repo: TaxonomyRepositoryInterface) {}

  async execute(): Promise<Result<TaxonomyCatalog, Failure>> {
    const [cuisinesResult, categoriesResult] = await Promise.all([
      this.repo.listCuisines(),
      this.repo.listCategories(),
    ]);
    if (!cuisinesResult.ok) {
      return fail(cuisinesResult.failure);
    }
    if (!categoriesResult.ok) {
      return fail(categoriesResult.failure);
    }
    return ok({
      cuisines: cuisinesResult.value,
      categories: categoriesResult.value,
    });
  }
}
