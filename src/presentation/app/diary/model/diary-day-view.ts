import type { DiaryDayViewLoading } from '@presentation/app/diary/model/states/diary-day-view-loading';
import type { DiaryDayViewError } from '@presentation/app/diary/model/states/diary-day-view-error';
import type { DiaryDayViewLoaded } from '@presentation/app/diary/model/states/diary-day-view-loaded';

/**
 * What the day column renders. A day already in the cache is `Loaded` even
 * while it refreshes — the skeleton is only for a day never seen.
 */
export type DiaryDayViewType =
  | DiaryDayViewLoading
  | DiaryDayViewError
  | DiaryDayViewLoaded;
