import { StoreStatus } from '@application/store/store-status';
import type { Page } from '@domain/common/page';
import type { PagedList } from '@application/diary/foods/paging/paged-list';

type LoadedList<T> = Extract<PagedList<T>, { status: typeof StoreStatus.Loaded }>;

/** A loaded list with the next page appended; a row it already holds (the server's order shifted) is not repeated. */
export const appendedList = <T>(list: LoadedList<T>, page: Page<T>, keyOf: (item: T) => string): PagedList<T> => {
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
