import type { StoreStatus } from '@application/store/store-status';

/** The last load landed; the data itself lives in the store's caches (`days`, `months`, `recent`, `goals`). */
export interface DiaryLoaded {
  status: typeof StoreStatus.Loaded;
}
