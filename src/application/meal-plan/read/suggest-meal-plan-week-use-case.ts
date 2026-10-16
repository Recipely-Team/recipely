import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';
import type { WeekSuggestion } from '@domain/meal-plan/suggest/week-suggestion';

/**
 * "Plan my week": asks for a drafted week of the user's own recipes. Nothing is
 * written; the user keeps picks or swaps and they are added as ordinary
 * entries. A new `seed` is "Shuffle".
 */
export class SuggestMealPlanWeekUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(weekStart: CalendarDate, meals: readonly MealSlotType[], seed: number): Promise<Result<WeekSuggestion, Failure>> {
    return this.repo.suggestWeek(weekStart, meals, seed);
  }
}
