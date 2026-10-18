/**
 * Values every paging list shares.
 *
 * @remarks
 * - **`endReachedThreshold`** is a fraction of the visible length, not a pixel
 *   count. It was half a screen, and on a phone that was too late: the user hit
 *   the bottom, the list bounced, and with nothing below it looked like the
 *   end. A screen and a half ahead lets the next page arrive first.
 * - **The windowing trio** exists because FlatList's defaults assume short
 *   rows. These lists are tall photo cards, and the defaults kept roughly
 *   twenty-one screens of them mounted — every one holding a decoded image.
 *   Lowering them trades a little blank space during a fast fling for a lot of
 *   memory and a lot of render work that nobody was going to see.
 */
export const ListConstants = {
  endReachedThreshold: 1.5,
  /** Rows rendered before the first frame — roughly one screen of cards. */
  initialRows: 6,
  /** Rows added per batch while scrolling. */
  rowsPerBatch: 6,
  /** Viewports kept mounted, centred on the visible one (was 21 by default). */
  windowSize: 7,
} as const;
