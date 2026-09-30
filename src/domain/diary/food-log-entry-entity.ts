import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { FoodLogEntryEntityProps } from '@domain/diary/food-log-entry-entity-props';

/**
 * One food the user logged on a day, in a meal — the food diary's aggregate
 * root. References its recipe by id only.
 *
 * @remarks
 * - **Values are a snapshot.** Editing the recipe later does not change what
 *   was eaten; changing `servings` is a server-side rescale.
 * - **Servings only need to be positive here** (≤ 20), not on the 0.5 step:
 *   the stepper rule is `Servings`'s, and an entry is shown however it was logged.
 */
export class FoodLogEntryEntity extends BaseEntity<FoodLogEntryEntityProps> {
  private constructor(props: FoodLogEntryEntityProps) {
    super(props);
  }

  static create(props: FoodLogEntryEntityProps): Result<FoodLogEntryEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.diaryEntry.idRequired, 'id'));
    }
    if (props.name.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.diaryEntry.nameRequired, 'name'));
    }
    if (!(props.servings > ValueConstants.zero && props.servings <= DiaryLimits.ServingsMax)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.diaryEntry.servingsInvalid, 'servings'));
    }
    return ok(new FoodLogEntryEntity(props));
  }

  get date(): CalendarDate {
    return this.props.date;
  }

  get meal(): MealSlotType {
    return this.props.meal;
  }

  get name(): string {
    return this.props.name;
  }

  get servings(): number {
    return this.props.servings;
  }

  get nutrients(): Nutrients {
    return this.props.nutrients;
  }

  get recipeId(): string | null {
    return this.props.recipeId;
  }

  get recipeImageUrl(): string | null {
    return this.props.recipeImageUrl;
  }

  get isQuickAdd(): boolean {
    return this.props.recipeId === null;
  }

  /** This entry as one serving of a food — what the edit sheet's stepper multiplies. */
  get food(): LoggableFood {
    return LoggableFood.of({
      name: this.props.name,
      perServing: this.props.nutrients.scale(ValueConstants.one / this.props.servings),
      recipeId: this.props.recipeId,
      imageUrl: this.props.recipeImageUrl,
    });
  }
}
