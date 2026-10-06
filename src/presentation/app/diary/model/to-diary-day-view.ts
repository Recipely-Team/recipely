import type { Failure } from '@core/failure';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { StoreStatus } from '@application/store/store-status';
import type { DiaryDayViewType } from '@presentation/app/diary/model/diary-day-view';

/** A cached day wins over an error: a failed refresh keeps the day on screen (`useDiaryDay` toasts the failure). */
export const toDiaryDayView = (day: DiaryDay | undefined, failure: Failure | null): DiaryDayViewType => {
  if (day !== undefined) return { status: StoreStatus.Loaded, day };
  if (failure !== null) return { status: StoreStatus.Error, failure };
  return { status: StoreStatus.Loading };
};
