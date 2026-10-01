/**
 * One page of any list the backend pages, with enough context to ask for the
 * next. The generic every new paged read model uses instead of a one-off
 * `XPage` interface per list.
 *
 * @remarks
 * - **`hasMore` comes from the backend's counts** (`page * pageSize < total`),
 *   never from how many items survived mapping, so a skipped row cannot make a
 *   list look finished.
 */
export interface Page<T> {
  readonly items: readonly T[];
  /** Every item across all pages, as the backend counts them. */
  readonly total: number;
  /** 1-based, matching the API. */
  readonly page: number;
  readonly pageSize: number;
  /** True while pages remain after this one. */
  readonly hasMore: boolean;
}
