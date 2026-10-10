import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import type { MealPlanEntryChanges } from '@domain/meal-plan/week/meal-plan-entry-changes';
import type { CopyMealPlanResult } from '@domain/meal-plan/week/copy-meal-plan-result';
import type { PlannedRecipeIngredients } from '@domain/meal-plan/shopping/planned-recipe-ingredients';

/** The viewer's meal plan (`/me/meal-plan`). Every range is inclusive and at most `MealPlanLimits.rangeDaysMax` days. */
export interface MealPlanRepositoryInterface {
  /** Sorted by date, meal, position. */
  list(from: CalendarDate, to: CalendarDate): Promise<Result<MealPlanEntryEntity[], Failure>>;
  /** Every planned recipe's ingredients, unscaled, eaten meals included. */
  ingredients(from: CalendarDate, to: CalendarDate): Promise<Result<PlannedRecipeIngredients[], Failure>>;
  add(entry: NewMealPlanEntry): Promise<Result<MealPlanEntryEntity, Failure>>;
  update(id: string, changes: MealPlanEntryChanges): Promise<Result<MealPlanEntryEntity, Failure>>;
  remove(id: string): Promise<Result<void, Failure>>;
  /** Idempotent: eating logs a diary entry, un-eating removes it. */
  setEaten(id: string, eaten: boolean): Promise<Result<MealPlanEntryEntity, Failure>>;
  clear(from: CalendarDate, to: CalendarDate): Promise<Result<void, Failure>>;
  copyWeek(fromWeekStart: CalendarDate, toWeekStart: CalendarDate): Promise<Result<CopyMealPlanResult, Failure>>;
}
