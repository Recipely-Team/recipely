import type { StoreStatus } from '@application/store/store-status';

export interface DiaryDayViewLoading {
  status: typeof StoreStatus.Loading;
}
