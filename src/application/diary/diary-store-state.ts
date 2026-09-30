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
import type { DiaryConcernType } from '@application/diary/diary-concern';

export interface DiaryStoreState {
  /** The day the Day view shows; starts on today (local). */
  selectedDate: CalendarDate;
  /** Loaded days by `CalendarDate.value`. A missing key means "not loaded yet". */
  days: Readonly<Record<string, DiaryDay>>;
  /** Loaded months by `CalendarMonth.value`. */
  months: Readonly<Record<string, DiaryMonth>>;
  recent: readonly LoggableFood[];
  /** Defaults until the first day, month or goals response arrives. */
  goals: NutritionGoals;
  loading: Readonly<Record<DiaryConcernType, boolean>>;
  errors: Readonly<Record<DiaryConcernType, Failure | null>>;
  /** Selects a day and loads it. */
  selectDate: (date: CalendarDate) => Promise<void>;
  /** Loads (or refreshes) a day; defaults to the selected one. A cached day stays on screen meanwhile; `loading.day` / `errors.day` track the selected day only. */
  loadDay: (date?: CalendarDate) => Promise<void>;
  loadMonth: (month: CalendarMonth) => Promise<void>;
  loadRecent: () => Promise<void>;
  loadGoals: () => Promise<void>;
  /** Saves, then re-derives every cached day and month against the new goals. */
  saveGoals: (goals: NutritionGoals) => Promise<Result<NutritionGoals, Failure>>;
  /** Adds; resolves once the server answers, then refreshes that day, its month (when cached) and the recent list in the background. */
  addEntry: (entry: NewFoodLogEntry) => Promise<Result<FoodLogEntryEntity, Failure>>;
  /** Updates; resolves once the server answers, then refreshes the old day and — when moved — the new one, plus their months, in the background. */
  updateEntry: (entry: FoodLogEntryEntity, changes: FoodLogEntryChanges) => Promise<Result<FoodLogEntryEntity, Failure>>;
  /** Removes the row at once; puts that one entry back, in its place, when the server refuses. */
  deleteEntry: (entry: FoodLogEntryEntity) => Promise<Result<void, Failure>>;
  /** Sets the day's glasses at once; on refusal returns to the last server-confirmed count, if this is still the latest tap. */
  setWater: (date: CalendarDate, glasses: number) => Promise<Result<void, Failure>>;
  clearError: (concern: DiaryConcernType) => void;
  /** Drops the signed-in user's diary. Called when the session ends. */
  clear: () => void;
}
