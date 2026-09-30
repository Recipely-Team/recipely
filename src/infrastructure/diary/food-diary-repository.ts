import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { DiaryDayDto } from '@infrastructure/diary/dtos/diary-day-dto';
import type { DiaryMonthDto } from '@infrastructure/diary/dtos/diary-month-dto';
import type { RecentFoodDto } from '@infrastructure/diary/dtos/recent-food-dto';
import type { FoodLogEntryDto } from '@infrastructure/diary/dtos/food-log-entry-dto';
import type { DayWaterDto } from '@infrastructure/diary/dtos/day-water-dto';
import type { NutritionGoalsDto } from '@infrastructure/diary/dtos/nutrition-goals-dto';
import { toDiaryDay } from '@infrastructure/diary/read/to-diary-day';
import { toDiaryMonth } from '@infrastructure/diary/read/to-diary-month';
import { toLoggableFood } from '@infrastructure/diary/read/to-loggable-food';
import { toFoodLogEntry } from '@infrastructure/diary/read/to-food-log-entry';
import { toNutritionGoals } from '@infrastructure/diary/read/to-nutrition-goals';
import { toCreateFoodLogEntryRequest } from '@infrastructure/diary/write/to-create-food-log-entry-request';
import { toUpdateFoodLogEntryRequest } from '@infrastructure/diary/write/to-update-food-log-entry-request';
import { toSetDayWaterRequest } from '@infrastructure/diary/write/to-set-day-water-request';
import { toRecentFoodsQuery } from '@infrastructure/diary/write/to-recent-foods-query';
import { toNutritionGoalsRequest } from '@infrastructure/diary/write/to-nutrition-goals-request';

/**
 * Implements `FoodDiaryRepositoryInterface` against `/diary` on the Recipely
 * backend. Paths carry the date / month / id; bodies and queries come from the
 * `write/` request mappers, responses go through the `read/` mappers.
 *
 * @remarks
 * - **A recent food that fails mapping is skipped**, not fatal: the list is a
 *   convenience, and one bad row should not empty the tab. A day or month
 *   that fails mapping fails whole — its totals would otherwise be wrong.
 */
export class FoodDiaryRepository implements FoodDiaryRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async getDay(date: CalendarDate): Promise<Result<DiaryDay, Failure>> {
    const result = await this.http.get<DiaryDayDto>(ApiRoutes.diary.day(date.value));
    return result.ok ? toDiaryDay(result.value) : result;
  }

  async getMonth(month: CalendarMonth): Promise<Result<DiaryMonth, Failure>> {
    const result = await this.http.get<DiaryMonthDto>(ApiRoutes.diary.month(month.value));
    return result.ok ? toDiaryMonth(result.value) : result;
  }

  async listRecent(limit: number): Promise<Result<LoggableFood[], Failure>> {
    const result = await this.http.get<RecentFoodDto[]>(ApiRoutes.diary.recent, { params: toRecentFoodsQuery(limit) });
    if (!result.ok) return result;
    return ok(result.value.map(toLoggableFood).flatMap((food) => (food.ok ? [food.value] : [])));
  }

  async addEntry(entry: NewFoodLogEntry): Promise<Result<FoodLogEntryEntity, Failure>> {
    const result = await this.http.post<FoodLogEntryDto>(ApiRoutes.diary.entries, toCreateFoodLogEntryRequest(entry));
    return result.ok ? toFoodLogEntry(result.value) : result;
  }

  async updateEntry(id: string, changes: FoodLogEntryChanges): Promise<Result<FoodLogEntryEntity, Failure>> {
    const result = await this.http.patch<FoodLogEntryDto>(ApiRoutes.diary.entry(id), toUpdateFoodLogEntryRequest(changes));
    return result.ok ? toFoodLogEntry(result.value) : result;
  }

  async deleteEntry(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.diary.entry(id));
    return result.ok ? ok(undefined) : result;
  }

  async setWater(date: CalendarDate, glasses: number): Promise<Result<number, Failure>> {
    const result = await this.http.put<DayWaterDto>(ApiRoutes.diary.dayWater(date.value), toSetDayWaterRequest(glasses));
    return result.ok ? ok(result.value.waterGlasses) : result;
  }

  async getGoals(): Promise<Result<NutritionGoals, Failure>> {
    const result = await this.http.get<NutritionGoalsDto>(ApiRoutes.diary.goals);
    return result.ok ? toNutritionGoals(result.value) : result;
  }

  async saveGoals(goals: NutritionGoals): Promise<Result<NutritionGoals, Failure>> {
    const result = await this.http.put<NutritionGoalsDto>(ApiRoutes.diary.goals, toNutritionGoalsRequest(goals));
    return result.ok ? toNutritionGoals(result.value) : result;
  }
}
