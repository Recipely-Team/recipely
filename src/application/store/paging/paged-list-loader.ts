import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { Page } from '@domain/common/page';
import { StoreStatus } from '@application/store/store-status';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { PagedList } from '@application/store/paging/paged-list';
import { loadedList } from '@application/store/paging/loaded-list';
import { appendedList } from '@application/store/paging/appended-list';
import { ListPosition, type ListPositionType } from '@application/store/paging/list-position';

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
 * - **`refresh` re-reads without a spinner**: a loaded list stays on screen
 *   while it fetches and keeps its rows when the fetch fails.
 * - **`removeItem` / `upsertItem` edit a loaded list in place**, keeping
 *   `total` in step (never below zero); before a list loads they do nothing.
 * - **A next page after removals re-reads from the shifted offset**: each
 *   removed row moved every later server row up by one, so asking `page + 1`
 *   would skip as many rows as were removed. The overlap it re-reads is
 *   de-duplicated by key.
 */
export class PagedListLoader<T> {
  private generation = ValueConstants.zero;
  private fetchPage: PageFetch<T> | null = null;
  private pageSize = ValueConstants.zero;
  /** Rows removed since the last page landed; the server's offsets moved by this much. */
  private removed = ValueConstants.zero;

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
    if (result.ok) this.landed(result.value);
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
    const removedBefore = this.removed;
    this.write({ ...current, isLoadingMore: true, moreFailure: null });
    const result = await fetchPage(this.nextPage(current.page));
    if (token !== this.generation) return;
    const latest = this.read();
    if (latest.status !== StoreStatus.Loaded) return;
    if (result.ok) this.landed(result.value, removedBefore);
    this.write(result.ok ? appendedList(latest, result.value, this.keyOf) : { ...latest, isLoadingMore: false, moreFailure: result.failure });
  }

  /** The first page again; a loaded list keeps showing (and keeps its rows on failure) instead of a spinner. */
  async refresh(fetchPage: PageFetch<T>): Promise<Failure | null> {
    if (this.read().status !== StoreStatus.Loaded) {
      await this.load(fetchPage);
      return null;
    }
    this.generation += ValueConstants.one;
    const token = this.generation;
    this.fetchPage = fetchPage;
    const result = await fetchPage(FIRST_PAGE);
    if (token !== this.generation) return null;
    const latest = this.read();
    if (result.ok) {
      this.landed(result.value);
      this.write(loadedList(result.value));
      return null;
    }
    if (latest.status === StoreStatus.Loaded) this.write({ ...latest, isLoadingMore: false });
    return result.failure;
  }

  removeItem(key: string): void {
    const current = this.read();
    if (current.status !== StoreStatus.Loaded) return;
    const items = current.items.filter((item) => this.keyOf(item) !== key);
    if (items.length === current.items.length) return;
    this.removed += ValueConstants.one;
    this.write({ ...current, items, total: Math.max(ValueConstants.zero, current.total - ValueConstants.one) });
  }

  /** Replaces the row with the same key where it stands, or adds it at `position` and counts it. */
  upsertItem(item: T, position: ListPositionType = ListPosition.Start): void {
    const current = this.read();
    if (current.status !== StoreStatus.Loaded) return;
    const key = this.keyOf(item);
    if (current.items.some((existing) => this.keyOf(existing) === key)) {
      this.write({ ...current, items: current.items.map((existing) => (this.keyOf(existing) === key ? item : existing)) });
      return;
    }
    const items = position === ListPosition.Start ? [item, ...current.items] : [...current.items, item];
    this.write({ ...current, items, total: current.total + ValueConstants.one });
  }

  /** Back to idle; anything in flight is dropped. */
  reset(): void {
    this.generation += ValueConstants.one;
    this.fetchPage = null;
    this.removed = ValueConstants.zero;
    this.write({ status: StoreStatus.Idle });
  }

  /** The 1-based page holding the first row not loaded yet, after the removals since the last page. */
  private nextPage(loadedPage: number): number {
    if (this.pageSize <= ValueConstants.zero) return loadedPage + ValueConstants.one;
    const offset = Math.max(ValueConstants.zero, loadedPage * this.pageSize - this.removed);
    return Math.floor(offset / this.pageSize) + ValueConstants.one;
  }

  /** A page arrived: its size sets the paging stride, and the removals it already reflects are settled. */
  private landed(page: Page<T>, removedBefore: number = this.removed): void {
    this.pageSize = page.pageSize;
    this.removed -= removedBefore;
  }
}
