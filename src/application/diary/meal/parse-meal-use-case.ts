import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import type { MealParseInputType } from '@domain/diary/meal/meal-parse-input';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import type { MealParseResult } from '@domain/diary/meal/meal-parse-result';

/**
 * Turns a described or photographed meal into candidate diary items. Nothing
 * is logged here — the user confirms the list, and each chosen item goes
 * through `AddFoodLogEntryUseCase` like any other food.
 *
 * @remarks
 * - **A blank or over-long description is refused before the request**, with
 *   the server's own keys (`input_required`, `text_too_long`), so the copy is
 *   the same and no daily allowance is spent on it.
 */
export class ParseMealUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(input: MealParseInputType): Promise<Result<MealParseResult, Failure>> {
    if (input.kind === MealParseInputKind.Text) {
      if (isBlank(input.text)) {
        return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.diary.mealTextRequired, 'text', ErrorMessageKey.mealParseInputRequired)));
      }
      if (input.text.trim().length > DiaryLimits.MealTextMaxLength) {
        return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.diary.mealTextTooLong, 'text', ErrorMessageKey.mealParseTextTooLong)));
      }
    }
    return this.repo.parseMeal(input);
  }
}
