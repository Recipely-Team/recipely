import type { DiaryDay } from '@domain/diary/day/diary-day';
import type { StoreStatus } from '@application/store/store-status';

export interface DiaryDayViewLoaded {
  status: typeof StoreStatus.Loaded;
  day: DiaryDay;
}
