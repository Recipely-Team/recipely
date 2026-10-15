import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';
import { ValueConstants } from '@core/constants';
import { pagingOf } from '@application/store/paging/list-paging/paging-of';

interface LoadMorePagingPorts<T> {
  read: () => ListPaging;
  write: (paging: ListPaging) => void;
  fetch: (page: number) => Promise<Result<Page<T>, Failure>>;
  /** False once a newer load or a sign-out superseded this request. */
  isCurrent: () => boolean;
  /** Adds the landed page's rows to the list. */
  append: (items: readonly T[]) => void;
}

/**
 * The 1-based page holding the first row not loaded yet. Each removal moved
 * every later server row up by one, so asking `page + 1` would skip as many
 * rows as were removed; the overlap re-read instead is de-duplicated by id.
 */
const nextPageOf = (paging: ListPaging): number => {
  if (paging.pageSize <= ValueConstants.zero) return paging.page + ValueConstants.one;
  const offset = Math.max(ValueConstants.zero, paging.page * paging.pageSize - paging.removed);
  return Math.floor(offset / paging.pageSize) + ValueConstants.one;
};

/**
 * The paging after a next page landed. Removals made while it was in flight
 * are not reflected in it, so they carry over to the page after.
 */
const pagingAfterMore = (page: Page<unknown>, removedBefore: number, latest: ListPaging): ListPaging => ({
  ...pagingOf(page),
  removed: latest.removed - removedBefore,
});

/**
 * **The next page of a hand-paged list** (Saved, Liked, Created): the same
 * rules as `PagedListLoader.loadMore` for stores that keep `ListPaging` beside
 * their rows.
 *
 * @remarks
 * - Nothing when there is no next page or one is already on its way.
 * - Starts after the removals made since the last page (`nextPageOf`).
 * - A failure keeps the rows and records `moreFailure`, so the list footer can
 *   offer "Try again"; a retry clears it.
 */
export const loadMorePaging = async <T>(ports: LoadMorePagingPorts<T>): Promise<void> => {
  const paging = ports.read();
  if (!paging.hasMore || paging.isLoadingMore) return;
  const removedBefore = paging.removed;
  ports.write({ ...paging, isLoadingMore: true, moreFailure: null });
  const result = await ports.fetch(nextPageOf(paging));
  if (!ports.isCurrent()) return;
  const latest = ports.read();
  if (!result.ok) {
    ports.write({ ...latest, isLoadingMore: false, moreFailure: result.failure });
    return;
  }
  ports.append(result.value.items);
  ports.write(pagingAfterMore(result.value, removedBefore, ports.read()));
};
