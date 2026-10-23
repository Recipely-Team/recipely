import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export interface ListLoaded<T> {
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
