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
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { FoodLogProduct } from '@domain/diary/entry/food-log-product';
import { LoggableProduct } from '@domain/diary/foods/loggable-product';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import { isBlank } from '@core/guards/type-guards';

/**
 * One food the user logged on a day, in a meal — the food diary's aggregate
 * root. References its recipe by id only.
 *
 * @remarks
 * - **Values are a snapshot.** Editing the recipe later does not change what
 *   was eaten; changing `servings` is a server-side rescale.
 * - **Servings only need to be positive here** (≤ 20, or ≤ 5000 of a
 *   product's unit), not on a step: the stepper rules are `Servings`'s and
 *   `FoodQuantity`'s, and an entry is shown however it was logged.
 */
export class FoodLogEntryEntity extends BaseEntity<FoodLogEntryEntityProps> {
  private constructor(props: FoodLogEntryEntityProps) {
    super(props);
  }

  static create(props: FoodLogEntryEntityProps): Result<FoodLogEntryEntity, ValidationFailure> {
    if (isBlank(props.id)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.diaryEntry.idRequired, 'id'));
    }
    if (isBlank(props.name)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.diaryEntry.nameRequired, 'name'));
    }
    const max = props.product === null ? DiaryLimits.ServingsMax : DiaryLimits.ProductQuantityMax;
    if (!(props.servings > ValueConstants.zero && props.servings <= max)) {
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

  get product(): FoodLogProduct | null {
    return this.props.product;
  }

  get isQuickAdd(): boolean {
    return this.props.recipeId === null && this.props.product === null;
  }

  /**
   * Only what an edit to `servings` and `meal` actually changes, or `null`
   * when nothing does — the server refuses an empty edit
   * (`errors.validation.nothing_to_edit`), so an untouched "Save" just closes.
   */
  changesTo(servings: number, meal: MealSlotType): FoodLogEntryChanges | null {
    const servingsChanged = servings !== this.props.servings;
    const mealChanged = meal !== this.props.meal;
    if (!servingsChanged && !mealChanged) return null;
    return {
      ...(servingsChanged ? { servings } : {}),
      ...(mealChanged ? { meal } : {}),
    };
  }

  /** A product entry as its product at the logged unit, with the quantity the edit sheet starts on; null otherwise. */
  get loggedProduct(): { product: LoggableProduct; quantity: FoodQuantity } | null {
    const product = this.props.product;
    if (product === null) return null;
    const loggable = LoggableProduct.fromLogged(this.props.name, product, this.props.nutrients.scale(ValueConstants.one / this.props.servings));
    const unit = loggable.units[ValueConstants.zero] ?? { key: product.unitKey, amount: product.unitAmount };
    return { product: loggable, quantity: FoodQuantity.of(unit, this.props.servings) };
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
