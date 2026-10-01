import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { DiaryLimits } from '@domain/diary/diary-limits';
import { FoodBaseUnit } from '@domain/diary/foods/units/food-base-unit';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import { isBaseUnitKey } from '@domain/diary/foods/units/is-base-unit-key';

/**
 * How much of a product the user is logging, in one of its units — the
 * product step's stepper value (Add food v2 spec §2b).
 *
 * @remarks
 * - **The step follows the unit**: serving units 0.5 (min 0.5), `ml` 50 (min
 *   50), `g` 10 (min 10); every unit caps at `DiaryLimits.ProductQuantityMax`.
 * - **Clamps, never fails.** `of` snaps any raw amount to the nearest step
 *   inside the bounds, so an entry logged elsewhere still opens.
 * - **Changing unit keeps the amount roughly**: into the base unit the current
 *   amount is converted and snapped; into a serving unit it restarts at 1.
 */
export class FoodQuantity extends BaseValueObject<number> {
  private constructor(
    private readonly unitOf: FoodUnit,
    value: number,
  ) {
    super(value);
  }

  static of(unit: FoodUnit, raw: number): FoodQuantity {
    const step = FoodQuantity.stepOf(unit);
    const stepped = Math.round(raw / step) * step;
    return new FoodQuantity(unit, Math.min(DiaryLimits.ProductQuantityMax, Math.max(step, stepped)));
  }

  /** The first serving unit at 1, or 100 of the base unit when there is no serving unit. */
  static defaultFor(units: readonly FoodUnit[]): FoodQuantity {
    const serving = units.find((unit) => !isBaseUnitKey(unit.key));
    if (serving !== undefined) return new FoodQuantity(serving, ValueConstants.one);
    const base = units[ValueConstants.zero] ?? { key: FoodBaseUnit.Grams, amount: ValueConstants.one };
    return FoodQuantity.of(base, DiaryLimits.PerHundred);
  }

  private static stepOf(unit: FoodUnit): number {
    if (unit.key === FoodBaseUnit.Milliliters) return DiaryLimits.MillilitersStep;
    if (unit.key === FoodBaseUnit.Grams) return DiaryLimits.GramsStep;
    return DiaryLimits.ServingUnitStep;
  }

  get unit(): FoodUnit {
    return this.unitOf;
  }

  get isBaseUnit(): boolean {
    return isBaseUnitKey(this.unitOf.key);
  }

  /** The amount in the product's base unit — what the per-100 nutrients scale by. */
  get baseAmount(): number {
    return this._value * this.unitOf.amount;
  }

  get canIncrement(): boolean {
    return this._value + FoodQuantity.stepOf(this.unitOf) <= DiaryLimits.ProductQuantityMax;
  }

  get canDecrement(): boolean {
    return this._value > FoodQuantity.stepOf(this.unitOf);
  }

  increment(): FoodQuantity {
    return this.canIncrement ? new FoodQuantity(this.unitOf, this._value + FoodQuantity.stepOf(this.unitOf)) : this;
  }

  decrement(): FoodQuantity {
    return this.canDecrement ? new FoodQuantity(this.unitOf, this._value - FoodQuantity.stepOf(this.unitOf)) : this;
  }

  inUnit(unit: FoodUnit): FoodQuantity {
    if (unit.key === this.unitOf.key) return this;
    return isBaseUnitKey(unit.key) ? FoodQuantity.of(unit, this.baseAmount) : new FoodQuantity(unit, ValueConstants.one);
  }

  override equals(other: FoodQuantity): boolean {
    return this._value === other.value && this.unitOf.key === other.unit.key;
  }
}
