import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * Any backend-paged list a store holds. `Loaded` carries the cursor (`page`,
 * `hasMore`) and the state of the next-page fetch, so a failed next page
 * shows an inline retry without losing the rows already there.
 */
export type PagedList<T> =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | {
      status: typeof StoreStatus.Loaded;
      items: readonly T[];
      /** 1-based page the loaded items reach up to. */
      page: number;
      /** Every item the backend holds across pages. */
      total: number;
      hasMore: boolean;
      isLoadingMore: boolean;
      /** Why the last next-page fetch failed; null once it is retried or succeeds. */
      moreFailure: Failure | null;
    }
  | { status: typeof StoreStatus.Error; failure: Failure };
