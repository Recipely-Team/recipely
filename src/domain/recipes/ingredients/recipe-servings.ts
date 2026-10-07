import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { RecipeLimits } from '@domain/recipes/recipe-limits';

/**
 * How many people a recipe is cooked for — the reader's choice on the detail
 * page, starting at what the recipe was written for.
 *
 * @remarks
 * - **Whole people, within `RecipeLimits`.** Stepping stops at the bounds;
 *   a recipe written for more than the maximum may still be shown, it just
 *   cannot be stepped further up. (Not the diary `Servings`, which steps in halves.)
 * - **`factorFrom(base)`** is what every ingredient amount is multiplied by.
 */
export class RecipeServings extends BaseValueObject<number> {
  private constructor(count: number) {
    super(count);
  }

  static create(count: number): Result<RecipeServings, ValidationFailure> {
    if (!Number.isInteger(count) || count < RecipeLimits.servingsMin) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipeServings.outOfRange));
    }
    return ok(new RecipeServings(count));
  }

  get canIncrement(): boolean {
    return this._value < RecipeLimits.servingsMax;
  }

  get canDecrement(): boolean {
    return this._value > RecipeLimits.servingsMin;
  }

  increment(): RecipeServings {
    return this.canIncrement ? new RecipeServings(this._value + ValueConstants.one) : this;
  }

  decrement(): RecipeServings {
    return this.canDecrement ? new RecipeServings(this._value - ValueConstants.one) : this;
  }

  factorFrom(base: RecipeServings): number {
    return this._value / base.value;
  }
}
