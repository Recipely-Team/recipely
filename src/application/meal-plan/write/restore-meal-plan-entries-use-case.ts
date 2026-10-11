import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/**
 * **Undo** for a remove or a cleared week: plans each meal again, in order.
 *
 * @remarks
 * - **One after another**, so they land in their slots in the order they had.
 * - **A refusal stops there** and is returned; the meals already back stay.
 * - An eaten meal comes back planned, not eaten — its diary entry was never removed.
 */
export class RestoreMealPlanEntriesUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  async execute(entries: readonly MealPlanEntryEntity[]): Promise<Result<MealPlanEntryEntity[], Failure>> {
    const restored: MealPlanEntryEntity[] = [];
    for (const entry of entries) {
      const result = await this.repo.add(entry.toNew());
      if (!result.ok) return result;
      restored.push(result.value);
    }
    return ok(restored);
  }
}
