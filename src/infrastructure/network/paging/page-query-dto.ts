/**
 * The query string every paged endpoint reads: which page, and how big.
 *
 * @remarks
 * Three repositories were passing `{ page, pageSize }` as an object literal at
 * the call site, and a fourth passed only `pageSize` — so favourites always
 * fetched the backend's default page and no type noticed. Naming the shape
 * means a request that forgets a field fails to compile rather than silently
 * asking for something else.
 */
export interface PageQueryDto {
  /** 1-based, as the API counts. */
  page: number;
  pageSize: number;
}
