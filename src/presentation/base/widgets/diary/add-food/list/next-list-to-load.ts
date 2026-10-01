import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/diary/foods/paging/paged-list';

/**
 * Which list the end of the scroll pages next: the first, in display order,
 * that has more and is neither loading nor showing a failed next page. Null
 * when every list is done.
 */
export const nextListToLoad = <K extends string>(lists: readonly { key: K; list: PagedList<unknown> }[]): K | null =>
  lists.find(
    ({ list }) => list.status === StoreStatus.Loaded && list.hasMore && !list.isLoadingMore && list.moreFailure === null,
  )?.key ?? null;
