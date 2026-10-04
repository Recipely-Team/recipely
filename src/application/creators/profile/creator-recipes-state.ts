import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/** The creator page's recipe grid, paged like the creators strip. */
export type CreatorRecipesState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | {
      status: typeof StoreStatus.Loaded;
      /** 1-based page the loaded recipes reach up to. */
      page: number;
      hasMore: boolean;
      /** True while the next page is in flight. */
      isLoadingMore?: boolean;
    }
  | { status: typeof StoreStatus.Error; failure: Failure };
