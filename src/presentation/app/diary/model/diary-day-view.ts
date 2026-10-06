import type { Failure } from '@core/failure';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import type { StoreStatus } from '@application/store/store-status';

/**
 * What the day column renders. A day already in the cache is `Loaded` even
 * while it refreshes — the skeleton is only for a day never seen.
 */
export type DiaryDayViewType =
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Error; failure: Failure }
  | { status: typeof StoreStatus.Loaded; day: DiaryDay };
