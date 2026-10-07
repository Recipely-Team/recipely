import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { CharConstants, ValueConstants } from '@core/constants';
import type { MeasureUnitType } from '@domain/recipes/ingredients/quantity/measure-unit';
import { MEASURE_UNITS } from '@domain/recipes/ingredients/quantity/measure-unit-catalogue';
import { conversionTarget } from '@domain/recipes/ingredients/quantity/conversion-ladder';
import { formatAmount } from '@domain/recipes/ingredients/quantity/format-amount';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';

interface QuantityProps {
  amount: number;
  /** The top of a range ("2-3"), or null for a single amount. */
  upTo: number | null;
  /** Null for a bare count: "3 yumurta". */
  unit: MeasureUnitType | null;
}

/**
 * How much of an ingredient: an amount (or range) in a unit.
 *
 * @remarks
 * - **Scaling multiplies both ends of a range** and keeps the unit.
 * - **Conversion stays within a dimension** — volume to volume, mass to mass
 *   — through the factors in `MEASURE_UNITS`; a count unit, or no unit,
 *   comes back unchanged rather than with an invented weight.
 * - **`toText` renders the amount the way a cook reads it** (`formatAmount`),
 *   keeping a unit spelling the recipe used when the unit did not change.
 */
export class Quantity extends BaseValueObject<QuantityProps> {
  private constructor(props: QuantityProps) {
    super(props);
  }

  static create(amount: number, unit: MeasureUnitType | null = null, upTo: number | null = null): Result<Quantity, ValidationFailure> {
    const valid = (n: number): boolean => Number.isFinite(n) && n > ValueConstants.zero;
    if (!valid(amount) || (upTo !== null && !valid(upTo))) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.quantity.amountNotPositive));
    }
    if (upTo !== null && upTo <= amount) return fail(new ValidationFailure(DiagnosticMessage.entity.quantity.rangeInverted));
    return ok(new Quantity({ amount, upTo, unit }));
  }

  get amount(): number {
    return this._value.amount;
  }

  get upTo(): number | null {
    return this._value.upTo;
  }

  get unit(): MeasureUnitType | null {
    return this._value.unit;
  }

  /** A non-positive or non-finite factor changes nothing. */
  scale(factor: number): Quantity {
    if (!Number.isFinite(factor) || factor <= ValueConstants.zero) return this;
    const { amount, upTo, unit } = this._value;
    return new Quantity({ amount: amount * factor, upTo: upTo === null ? null : upTo * factor, unit });
  }

  toMetric(): Quantity {
    return this.inSystem(UnitSystem.Metric);
  }

  toImperial(): Quantity {
    return this.inSystem(UnitSystem.Imperial);
  }

  inSystem(system: UnitSystemType): Quantity {
    const { amount, upTo, unit } = this._value;
    const from = unit === null ? null : MEASURE_UNITS[unit];
    if (from === null || from.base === null) return this;
    const target = conversionTarget(system, from.dimension, amount * from.base);
    const toBase = target === null ? null : MEASURE_UNITS[target].base;
    if (target === null || toBase === null) return this;
    const ratio = from.base / toBase;
    return new Quantity({ amount: amount * ratio, upTo: upTo === null ? null : upTo * ratio, unit: target });
  }

  /** "1½ su bardağı", "2-3", "1.5 kg" — `writtenUnit` is kept unless it names the unit generically. */
  toText(decimalMark: string, writtenUnit: string = CharConstants.empty): string {
    const { amount, upTo, unit } = this._value;
    const fraction = unit === null || MEASURE_UNITS[unit].fraction;
    const amounts = [amount, upTo].flatMap((n) => (n === null ? [] : [formatAmount(n, fraction, decimalMark)]));
    const label = this.unitLabel(writtenUnit);
    return [amounts.join(CharConstants.dash), label].filter((part) => part.length > ValueConstants.zero).join(CharConstants.space);
  }

  equals(other: Quantity): boolean {
    return this.amount === other.amount && this.upTo === other.upTo && this.unit === other.unit;
  }

  /** The unit as it reads: `writtenUnit` unless it names the unit generically, else the unit's own word; empty for a bare count. */
  unitLabel(writtenUnit: string = CharConstants.empty): string {
    if (this.unit === null) return CharConstants.empty;
    const { one, other } = MEASURE_UNITS[this.unit];
    const generic = [one, other].includes(writtenUnit.toLowerCase());
    if (writtenUnit.length > ValueConstants.zero && !generic) return writtenUnit;
    return (this.upTo ?? this.amount) > ValueConstants.one ? other : one;
  }
}
