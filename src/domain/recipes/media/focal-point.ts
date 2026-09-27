import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { CharConstants, ValueConstants } from '@core/constants';

interface FocalPointValue {
  readonly x: number;
  readonly y: number;
}

/**
 * Where the dish sits in a photo: `x` from the left edge and `y` from the top,
 * each a share of the frame in 0..1.
 *
 * @remarks
 * - **What it is for.** A card or the hero crops its photo to a fixed shape,
 *   and a centred crop of a hand-held shot lands on a wrist or a pot rim as
 *   often as on the food. The backend finds this point in a background sweep;
 *   the crop is positioned on it.
 * - **Validated once, here.** A pair outside the frame is refused, so no
 *   caller ever positions a crop off the photo. Absence is not a failure — a
 *   photo the sweep has not reached simply has no focal point, and the crop
 *   stays centred.
 * - **Equality compares both axes** — the base class compares by `===`, which
 *   an object value would never satisfy.
 */
export class FocalPoint extends BaseValueObject<FocalPointValue> {
  private constructor(value: FocalPointValue) {
    super(value);
  }

  static create(x: number, y: number): Result<FocalPoint, ValidationFailure> {
    if (!FocalPoint.inFrame(x) || !FocalPoint.inFrame(y)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.focalPointOutOfFrame, FailureField.focus));
    }
    return ok(new FocalPoint({ x, y }));
  }

  get x(): number {
    return this._value.x;
  }

  get y(): number {
    return this._value.y;
  }

  override equals(other: BaseValueObject<FocalPointValue>): boolean {
    return this._value.x === other.value.x && this._value.y === other.value.y;
  }

  override toString(): string {
    return `${this._value.x}${CharConstants.comma}${this._value.y}`;
  }

  private static inFrame(n: number): boolean {
    return Number.isFinite(n) && n >= ValueConstants.zero && n <= ValueConstants.one;
  }
}
