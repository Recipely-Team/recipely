import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import type { MealPlanEntryChanges } from '@domain/meal-plan/week/meal-plan-entry-changes';
import type { CopyMealPlanResult } from '@domain/meal-plan/week/copy-meal-plan-result';
import type { PlannedRecipeIngredients } from '@domain/meal-plan/shopping/planned-recipe-ingredients';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { MealPlanDto } from '@infrastructure/meal-plan/dtos/meal-plan-dto';
import type { MealPlanEntryDto } from '@infrastructure/meal-plan/dtos/meal-plan-entry-dto';
import type { MealPlanIngredientsDto } from '@infrastructure/meal-plan/dtos/meal-plan-ingredients-dto';
import type { CopyMealPlanResultDto } from '@infrastructure/meal-plan/dtos/copy-meal-plan-result-dto';
import { toMealPlanEntry } from '@infrastructure/meal-plan/read/to-meal-plan-entry';
import { toMealPlanEntries } from '@infrastructure/meal-plan/read/to-meal-plan-entries';
import { toPlannedRecipeIngredients } from '@infrastructure/meal-plan/read/to-planned-recipe-ingredients';
import { toMealPlanRangeQuery } from '@infrastructure/meal-plan/write/to-meal-plan-range-query';
import { toCreateMealPlanEntryRequest } from '@infrastructure/meal-plan/write/to-create-meal-plan-entry-request';
import { toUpdateMealPlanEntryRequest } from '@infrastructure/meal-plan/write/to-update-meal-plan-entry-request';
import { toCopyMealPlanRequest } from '@infrastructure/meal-plan/write/to-copy-meal-plan-request';

/** Implements `MealPlanRepositoryInterface` against `/me/meal-plan` (backend #392). */
export class MealPlanRepository implements MealPlanRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async list(from: CalendarDate, to: CalendarDate): Promise<Result<MealPlanEntryEntity[], Failure>> {
    const result = await this.http.get<MealPlanDto>(ApiRoutes.mealPlan.root, { params: toMealPlanRangeQuery({ from, to }) });
    return result.ok ? ok(toMealPlanEntries(result.value)) : result;
  }

  async ingredients(from: CalendarDate, to: CalendarDate): Promise<Result<PlannedRecipeIngredients[], Failure>> {
    const result = await this.http.get<MealPlanIngredientsDto>(ApiRoutes.mealPlan.ingredients, { params: toMealPlanRangeQuery({ from, to }) });
    return result.ok ? ok(toPlannedRecipeIngredients(result.value)) : result;
  }

  async add(entry: NewMealPlanEntry): Promise<Result<MealPlanEntryEntity, Failure>> {
    const result = await this.http.post<MealPlanEntryDto>(ApiRoutes.mealPlan.entries, toCreateMealPlanEntryRequest(entry));
    return result.ok ? toMealPlanEntry(result.value) : result;
  }

  async update(id: string, changes: MealPlanEntryChanges): Promise<Result<MealPlanEntryEntity, Failure>> {
    const result = await this.http.patch<MealPlanEntryDto>(ApiRoutes.mealPlan.entry(id), toUpdateMealPlanEntryRequest(changes));
    return result.ok ? toMealPlanEntry(result.value) : result;
  }

  async remove(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.mealPlan.entry(id));
    return result.ok ? ok(undefined) : result;
  }

  async setEaten(id: string, eaten: boolean): Promise<Result<MealPlanEntryEntity, Failure>> {
    const url = ApiRoutes.mealPlan.entryEaten(id);
    const result = eaten ? await this.http.post<MealPlanEntryDto>(url) : await this.http.delete<MealPlanEntryDto>(url);
    return result.ok ? toMealPlanEntry(result.value) : result;
  }

  async clear(from: CalendarDate, to: CalendarDate): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.mealPlan.root, { params: toMealPlanRangeQuery({ from, to }) });
    return result.ok ? ok(undefined) : result;
  }

  async copyWeek(fromWeekStart: CalendarDate, toWeekStart: CalendarDate): Promise<Result<CopyMealPlanResult, Failure>> {
    const result = await this.http.post<CopyMealPlanResultDto>(ApiRoutes.mealPlan.copy, toCopyMealPlanRequest({ from: fromWeekStart, to: toWeekStart }));
    return result.ok ? ok({ copied: result.value.copied, skipped: result.value.skipped }) : result;
  }
}
