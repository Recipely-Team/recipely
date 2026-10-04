import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';

/**
 * Which list the end of the scroll pages next: the first, in display order,
 * that has more and is not showing a failed next page. Null when every list
 * is done, or while any list's next page is still loading.
 */
export const nextListToLoad = <K extends string>(lists: readonly { key: K; list: PagedList<unknown> }[]): K | null => {
  // One next page at a time: another would be inserted above rows still arriving.
  if (lists.some(({ list }) => list.status === StoreStatus.Loaded && list.isLoadingMore)) return null;
  return lists.find(({ list }) => list.status === StoreStatus.Loaded && list.hasMore && list.moreFailure === null)?.key ?? null;
};
