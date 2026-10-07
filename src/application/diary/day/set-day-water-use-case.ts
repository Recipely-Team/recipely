import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { WaterGlasses } from '@domain/diary/day/water-glasses';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/**
 * Sets a day's water to a number of glasses. A value `WaterGlasses` refuses is
 * refused here, before a request is spent on it.
 */
export class SetDayWaterUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(date: CalendarDate, glasses: number): Promise<Result<number, Failure>> {
    const water = WaterGlasses.create(glasses);
    return water.ok ? this.repo.setWater(date, water.value.value) : Promise.resolve(water);
  }
}
