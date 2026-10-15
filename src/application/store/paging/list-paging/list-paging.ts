import type { Page } from '@domain/common/page';
import type { Failure } from '@core/failure';

/**
 * Where a store's list stands against the server: the last page it holds, the
 * server's total and whether more pages exist — the `Page` envelope's own
 * fields, kept beside the list's rows so the screens reading those rows stay
 * as they are — plus whether the next page is on its way, the rows removed
 * since it landed and why the last next page failed.
 */
export type ListPaging = Omit<Page<unknown>, 'items'> & {
  readonly isLoadingMore: boolean;
  /** Rows removed since the last page landed; the server's offsets moved up by this much. */
  readonly removed: number;
  /** Why the last next-page fetch failed; null when it did not. */
  readonly moreFailure: Failure | null;
};
