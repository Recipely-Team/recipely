import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { Page } from '@domain/common/page';
import { StoreStatus } from '@application/store/store-status';
import { FIRST_PAGE } from '@infrastructure/constants/api/api-paging';
import type { PagedList } from '@application/store/paging/paged-list';
import { loadedList } from '@application/store/paging/loaded-list';
import { appendedList } from '@application/store/paging/appended-list';

/** Fetches one 1-based page of a list. */
type PageFetch<T> = (page: number) => Promise<Result<Page<T>, Failure>>;

/**
 * Drives one `PagedList` field of a store: the first page, the next one on
 * scroll, and a reset.
 *
 * @remarks
 * - **The newest first page wins.** `begin` bumps a generation; an answer —
 *   first page or next page — started under an older one is dropped, so a
 *   slow response for an old query never replaces a newer one.
 * - **`begin` / `settle` split the first page** for a caller that fetches it
 *   some other way (the food search gets every group's first page in one
 *   request); `load` is the two in a row.
 * - **A next page reuses the first page's fetch**, so it asks for the same
 *   query, shelf or group.
 */
export class PagedListLoader<T> {
  private generation = ValueConstants.zero;
  private fetchPage: PageFetch<T> | null = null;

  constructor(
    private readonly read: () => PagedList<T>,
    private readonly write: (list: PagedList<T>) => void,
    private readonly keyOf: (item: T) => string,
  ) {}

  /** Starts a first page that later pages will fetch with `fetchPage`; returns the token `settle` needs. */
  begin(fetchPage: PageFetch<T>): number {
    this.generation += ValueConstants.one;
    this.fetchPage = fetchPage;
    this.write({ status: StoreStatus.Loading });
    return this.generation;
  }

  settle(token: number, result: Result<Page<T>, Failure>): void {
    if (token !== this.generation) return;
    this.write(result.ok ? loadedList(result.value) : { status: StoreStatus.Error, failure: result.failure });
  }

  async load(fetchPage: PageFetch<T>): Promise<void> {
    const token = this.begin(fetchPage);
    this.settle(token, await fetchPage(FIRST_PAGE));
  }

  /** The next page, unless there is none, one is in flight or nothing has loaded. A failure keeps the rows. */
  async loadMore(): Promise<void> {
    const current = this.read();
    const fetchPage = this.fetchPage;
    if (fetchPage === null || current.status !== StoreStatus.Loaded || !current.hasMore || current.isLoadingMore) return;
    const token = this.generation;
    this.write({ ...current, isLoadingMore: true, moreFailure: null });
    const result = await fetchPage(current.page + ValueConstants.one);
    if (token !== this.generation) return;
    const latest = this.read();
    if (latest.status !== StoreStatus.Loaded) return;
    this.write(result.ok ? appendedList(latest, result.value, this.keyOf) : { ...latest, isLoadingMore: false, moreFailure: result.failure });
  }

  /** Back to idle; anything in flight is dropped. */
  reset(): void {
    this.generation += ValueConstants.one;
    this.fetchPage = null;
    this.write({ status: StoreStatus.Idle });
  }
}
