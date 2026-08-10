import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * The drafts list. `Loaded` carries the page cursor because the list pages:
 * without `hasMore` the screen has no way to know whether asking for more is
 * worth it, and without `page` the next request cannot say which page it wants.
 */
export type DraftsListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | {
      status: typeof StoreStatus.Loaded;
      /** 1-based page the loaded drafts reach up to. */
      page: number;
      /** True while the backend holds drafts beyond the ones loaded. */
      hasMore: boolean;
      /** True while an appending fetch for the next page is in flight. */
      isLoadingMore?: boolean;
    }
  | { status: typeof StoreStatus.Error; failure: Failure };
