import type { StoreStatus } from '@application/store/store-status';

/** On its way; a cached day or month stays on screen meanwhile. */
export interface DiaryLoading {
  status: typeof StoreStatus.Loading;
}
