import { StoreStatus } from '@application/store/store-status';
import type { Page } from '@domain/common/page';
import type { ListLoaded } from '@application/store/paging/states/list-loaded';

/** A first page as the `ListLoaded` state. */
export const loadedList = <T>(page: Page<T>): ListLoaded<T> => ({
  status: StoreStatus.Loaded,
  items: page.items,
  page: page.page,
  total: page.total,
  hasMore: page.hasMore,
  isLoadingMore: false,
  moreFailure: null,
});
