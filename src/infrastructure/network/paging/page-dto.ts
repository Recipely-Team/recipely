/**
 * The backend's `PageResult` envelope, shared by every paged list:
 * `{ items, total, page, pageSize }`. `hasMore` is not on the wire; `toPage`
 * derives it.
 */
export interface PageDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
