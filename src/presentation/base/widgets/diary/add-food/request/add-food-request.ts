import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';

/**
 * What the Add food sheet is asked to do (design spec → Food Diary §6,
 * payload `{ date, meal?, recipe?, entry? }`). `meal: null` defaults it from
 * the clock; `query` pre-fills the pick step's search (the assistant's `searchFood`);
 * `mealText` opens the meal panel and reads that description at once (the
 * assistant's `logMeal`).
 */
export type AddFoodRequestType =
  | { kind: typeof AddFoodRequestKind.Pick; date: CalendarDate; meal: MealSlotType | null; query?: string; mealText?: string }
  | { kind: typeof AddFoodRequestKind.Food; date: CalendarDate; meal: MealSlotType | null; food: LoggableFood }
  | { kind: typeof AddFoodRequestKind.Edit; entry: FoodLogEntryEntity };
