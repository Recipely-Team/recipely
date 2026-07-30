import type { Failure } from '@core/failure';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import { TaxonomyStatus } from '@application/recipes/taxonomy/taxonomy-status';

export interface TaxonomyStoreState {
  cuisines: readonly TaxonomyItem[];
  categories: readonly TaxonomyItem[];
  status: TaxonomyStatus;
  failure: Failure | null;
  /**
   * Loads the cuisine + category catalogs. Idempotent: a no-op while already
   * `loading` or once `ready`, so screens can call it freely on mount without
   * triggering duplicate fetches.
   */
  load: () => Promise<void>;
  /**
   * Re-fetches the catalogs even when already `ready`. Used when the app
   * locale changes: the backend localizes names via `Accept-Language`, so the
   * cached entries are in the previous language until re-fetched. Still a
   * no-op while a fetch is in flight.
   */
  reload: () => Promise<void>;
}
