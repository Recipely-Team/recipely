import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';

/**
 * Reads the backend-driven recipe taxonomy catalog (cuisines and categories).
 * Lists are localized server-side via `Accept-Language`; implementations only
 * fetch and map, never translate.
 */
export interface TaxonomyRepositoryInterface {
  /** Fetches the full localized cuisine catalog. */
  listCuisines(): Promise<Result<TaxonomyItem[], Failure>>;

  /** Fetches the full localized category catalog. */
  listCategories(): Promise<Result<TaxonomyItem[], Failure>>;
}
