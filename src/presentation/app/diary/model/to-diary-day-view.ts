import type { Failure } from '@core/failure';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { StoreStatus } from '@application/store/store-status';
import type { DiaryDayView } from '@presentation/app/diary/model/diary-day-view';

/** A cached day wins over an error: a failed refresh keeps the day on screen (the toast says it failed). */
export const toDiaryDayView = (day: DiaryDay | undefined, failure: Failure | null): DiaryDayView => {
  if (day !== undefined) return { status: StoreStatus.Loaded, day };
  if (failure !== null) return { status: StoreStatus.Error, failure };
  return { status: StoreStatus.Loading };
};
