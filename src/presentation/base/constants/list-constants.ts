/**
 * Values every paging list shares.
 *
 * @remarks
 * - **`endReachedThreshold`** is a fraction of the visible length, not a pixel
 *   count: half a screen ahead is enough for the next page to arrive before the
 *   user reaches it, without prefetching pages they may never scroll to. It
 *   lived as a bare `0.5` in the recipe feed until the drafts list needed the
 *   same behaviour.
 */
export const ListConstants = {
  endReachedThreshold: 0.5,
} as const;
