import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * The creators strip. `Loaded` carries the page cursor, as the drafts list
 * does: `hasMore` says whether scrolling on is worth a request, `page` which
 * page that request asks for.
 */
export type CreatorsListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | {
      status: typeof StoreStatus.Loaded;
      /** 1-based page the loaded creators reach up to. */
      page: number;
      /** True while the backend holds creators beyond the ones loaded. */
      hasMore: boolean;
      /** True while an appending fetch for the next page is in flight. */
      isLoadingMore?: boolean;
    }
  | { status: typeof StoreStatus.Error; failure: Failure };
