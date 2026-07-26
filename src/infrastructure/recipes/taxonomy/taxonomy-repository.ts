import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ITaxonomyRepository } from '@domain/recipes/taxonomy/i-taxonomy-repository';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { CategoriesResponseDto } from '@infrastructure/recipes/taxonomy/dtos/categories-response-dto';
import type { CuisinesResponseDto } from '@infrastructure/recipes/taxonomy/dtos/cuisines-response-dto';
import { toTaxonomyItems } from '@infrastructure/recipes/taxonomy/taxonomy-mapper';

/**
 * Implements `ITaxonomyRepository` against the Recipely backend. Fetches the
 * localized cuisine and category catalogs; localization is handled server-side
 * via the `Accept-Language` header the HTTP client already attaches.
 */
export class TaxonomyRepository implements ITaxonomyRepository {
  constructor(private readonly http: HttpClient) {}

  async listCuisines(): Promise<Result<TaxonomyItem[], Failure>> {
    const result = await this.http.request<CuisinesResponseDto>({
      method: 'GET',
      url: ApiRoutes.recipes.cuisines,
    });
    if (!result.ok) {
      return result;
    }
    return ok(toTaxonomyItems(result.value.cuisines));
  }

  async listCategories(): Promise<Result<TaxonomyItem[], Failure>> {
    const result = await this.http.request<CategoriesResponseDto>({
      method: 'GET',
      url: ApiRoutes.recipes.categories,
    });
    if (!result.ok) {
      return result;
    }
    return ok(toTaxonomyItems(result.value.categories));
  }
}
