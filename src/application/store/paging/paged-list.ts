import type { ListIdle } from '@application/store/paging/states/list-idle';
import type { ListLoading } from '@application/store/paging/states/list-loading';
import type { ListLoaded } from '@application/store/paging/states/list-loaded';
import type { ListError } from '@application/store/paging/states/list-error';

/**
 * Any backend-paged list a store holds. `Loaded` carries the cursor (`page`,
 * `hasMore`) and the state of the next-page fetch, so a failed next page
 * shows an inline retry without losing the rows already there.
 */
export type PagedList<T> =
  | ListIdle
  | ListLoading
  | ListLoaded<T>
  | ListError;
