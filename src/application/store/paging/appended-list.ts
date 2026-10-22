import { StoreStatus } from '@application/store/store-status';
import type { Page } from '@domain/common/page';
import type { ListLoaded } from '@application/store/paging/states/list-loaded';

/** A loaded list with the next page appended; a row it already holds (the server's order shifted) is not repeated. */
export const appendedList = <T>(list: ListLoaded<T>, page: Page<T>, keyOf: (item: T) => string): ListLoaded<T> => {
  const known = new Set(list.items.map(keyOf));
  return {
    status: StoreStatus.Loaded,
    items: [...list.items, ...page.items.filter((item) => !known.has(keyOf(item)))],
    page: page.page,
    total: page.total,
    hasMore: page.hasMore,
    isLoadingMore: false,
    moreFailure: null,
  };
};
