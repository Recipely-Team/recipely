import { StoreStatus } from '@application/store/store-status';
import type { Page } from '@domain/common/page';
import type { PagedList } from '@application/store/paging/paged-list';

/** A first page as a loaded `PagedList`. */
export const loadedList = <T>(page: Page<T>): PagedList<T> => ({
  status: StoreStatus.Loaded,
  items: page.items,
  page: page.page,
  total: page.total,
  hasMore: page.hasMore,
  isLoadingMore: false,
  moreFailure: null,
});
