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

/**
 * The signed-in user's food diary. Every call is scoped to the session's user
 * by the server; nothing here takes a user id.
 */
export interface FoodDiaryRepositoryInterface {
  getDay(date: CalendarDate): Promise<Result<DiaryDay, Failure>>;
  getMonth(month: CalendarMonth): Promise<Result<DiaryMonth, Failure>>;
  /** Distinct foods logged before, most recent first, each reduced to one serving. */
  listRecent(limit: number): Promise<Result<LoggableFood[], Failure>>;
  addEntry(entry: NewFoodLogEntry): Promise<Result<FoodLogEntryEntity, Failure>>;
  updateEntry(id: string, changes: FoodLogEntryChanges): Promise<Result<FoodLogEntryEntity, Failure>>;
  deleteEntry(id: string): Promise<Result<void, Failure>>;
  /** Sets (not adds to) the day's glasses; resolves with what the server stored. */
  setWater(date: CalendarDate, glasses: number): Promise<Result<number, Failure>>;
  /** The saved goals, or the defaults when the user never saved any. */
  getGoals(): Promise<Result<NutritionGoals, Failure>>;
  saveGoals(goals: NutritionGoals): Promise<Result<NutritionGoals, Failure>>;
}
