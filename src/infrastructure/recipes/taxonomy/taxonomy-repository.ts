import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { TaxonomyRepositoryInterface } from '@domain/recipes/taxonomy/taxonomy-repository-interface';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { CategoriesResponseDto } from '@infrastructure/recipes/taxonomy/dtos/categories-response-dto';
import type { CuisinesResponseDto } from '@infrastructure/recipes/taxonomy/dtos/cuisines-response-dto';
import { toTaxonomyItems } from '@infrastructure/recipes/taxonomy/taxonomy-mapper';

/**
 * Implements `TaxonomyRepositoryInterface` against the Recipely backend. Fetches the
 * localized cuisine and category catalogs; localization is handled server-side
 * via the `Accept-Language` header the HTTP client already attaches.
 */
export class TaxonomyRepository implements TaxonomyRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async listCuisines(): Promise<Result<TaxonomyItem[], Failure>> {
    const result = await this.http.get<CuisinesResponseDto>(ApiRoutes.recipes.cuisines);
    if (!result.ok) {
      return result;
    }
    return ok(toTaxonomyItems(result.value.cuisines));
  }

  async listCategories(): Promise<Result<TaxonomyItem[], Failure>> {
    const result = await this.http.get<CategoriesResponseDto>(ApiRoutes.recipes.categories);
    if (!result.ok) {
      return result;
    }
    return ok(toTaxonomyItems(result.value.categories));
  }
}
