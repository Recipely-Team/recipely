import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/**
 * Sets a day's water to a number of glasses. A value outside 0–12 or not a
 * whole glass is refused here, before a request is spent on it.
 */
export class SetDayWaterUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(date: CalendarDate, glasses: number): Promise<Result<number, Failure>> {
    if (!Number.isInteger(glasses) || glasses < DiaryLimits.WaterGlassesMin || glasses > DiaryLimits.WaterGlassesMax) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.diary.waterInvalid(glasses), 'glasses')));
    }
    return this.repo.setWater(date, glasses);
  }
}
