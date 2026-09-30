import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { Servings } from '@domain/diary/entry/servings';
import type { LoggableFoodProps } from '@domain/diary/entry/loggable-food-props';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';

/**
 * Something the Add food sheet can log: a recipe, a recent food or a quick
 * add, reduced to one serving's nutrients.
 *
 * @remarks
 * - **One serving is the unit** (v1 has no grams or pieces — design spec
 *   scope cut), so the detail step's total box is `nutrientsFor(servings)`.
 * - **`of` is total** for foods whose source was already validated (a recipe,
 *   a recent food); hand-typed input goes through `quickAdd`, which is not.
 */
export class LoggableFood {
  private constructor(private readonly props: LoggableFoodProps) {}

  static of(props: LoggableFoodProps): LoggableFood {
    return new LoggableFood(props);
  }

  /**
   * A food typed in by hand — the Quick add tab. The name is trimmed and must
   * fit 1–120 characters; one serving must have calories (> 0) and stay within
   * the entry caps. Failures
   * carry the backend's `messageKey`, so the form shows the same copy the
   * server would have caused.
   */
  static quickAdd(name: string, perServing: Nutrients): Result<LoggableFood, ValidationFailure> {
    const trimmed = name.trim();
    if (trimmed.length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.foodNameRequired, 'name', ErrorMessageKey.diaryFoodNameRequired));
    }
    if (trimmed.length > DiaryLimits.NameMaxLength) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.foodNameTooLong, 'name', ErrorMessageKey.diaryFoodNameTooLong));
    }
    if (perServing.calories <= ValueConstants.zero || !perServing.isWithinEntryCaps) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.nutrientTooHigh('calories'), 'calories', ErrorMessageKey.diaryNutrientInvalid));
    }
    return ok(new LoggableFood({ name: trimmed, perServing, recipeId: null, imageUrl: null }));
  }

  get name(): string {
    return this.props.name;
  }

  get perServing(): Nutrients {
    return this.props.perServing;
  }

  get recipeId(): string | null {
    return this.props.recipeId;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  /** A quick add has no recipe behind it — the UI shows a bolt tile instead of a photo. */
  get isQuickAdd(): boolean {
    return this.props.recipeId === null;
  }

  nutrientsFor(servings: Servings): Nutrients {
    return this.props.perServing.scale(servings.value);
  }

  entryFor(date: CalendarDate, meal: MealSlotType, servings: Servings): NewFoodLogEntry {
    return {
      date,
      meal,
      name: this.props.name,
      servings: servings.value,
      nutrients: this.nutrientsFor(servings),
      recipeId: this.props.recipeId,
    };
  }
}
