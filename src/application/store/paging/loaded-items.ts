import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';

/** The rows a list holds, or none while it is not loaded. */
export const loadedItems = <T>(list: PagedList<T>): readonly T[] => (list.status === StoreStatus.Loaded ? list.items : []);
