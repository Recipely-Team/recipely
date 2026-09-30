import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Loads one day of the diary: entries, water and the goals in force. */
export class LoadDiaryDayUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(date: CalendarDate): Promise<Result<DiaryDay, Failure>> {
    return this.repo.getDay(date);
  }
}
