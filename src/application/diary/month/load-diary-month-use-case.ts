import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Loads a month's per-day kcal summary for the calendar and its stats. */
export class LoadDiaryMonthUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(month: CalendarMonth): Promise<Result<DiaryMonth, Failure>> {
    return this.repo.getMonth(month);
  }
}
