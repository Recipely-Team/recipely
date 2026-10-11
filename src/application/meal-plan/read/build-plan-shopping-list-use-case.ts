import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import { mergePlanIngredients } from '@domain/meal-plan/shopping/merge-plan-ingredients';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/**
 * The week's shopping list before it is added: every planned recipe's
 * ingredients (eaten meals too — they were bought for), scaled to the planned
 * servings and merged by name and aisle in the domain (`mergePlanIngredients`).
 */
export class BuildPlanShoppingListUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  async execute(day: CalendarDate): Promise<Result<PlanShoppingLine[], Failure>> {
    const week = MealPlanWeek.of(day, []);
    const result = await this.repo.ingredients(week.start, week.end);
    return result.ok ? ok(mergePlanIngredients(result.value)) : result;
  }
}
