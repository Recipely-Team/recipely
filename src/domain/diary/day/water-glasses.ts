import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { DiaryLimits } from '@domain/diary/diary-limits';

/**
 * A day's water, in whole 250 ml glasses — the one place its bounds live.
 *
 * @remarks
 * - **0–12 whole glasses** (design spec §3; backend `DiaryLimits`).
 * - **`create` refuses, `clamped` forgives**: user input is validated before a
 *   request is spent on it; a value read back from the server is clamped so
 *   the card always draws.
 */
export class WaterGlasses extends BaseValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(glasses: number): Result<WaterGlasses, ValidationFailure> {
    if (!Number.isInteger(glasses) || glasses < DiaryLimits.WaterGlassesMin || glasses > DiaryLimits.WaterGlassesMax) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.waterInvalid(glasses), 'glasses'));
    }
    return ok(new WaterGlasses(glasses));
  }

  static clamped(glasses: number): WaterGlasses {
    return new WaterGlasses(Math.min(DiaryLimits.WaterGlassesMax, Math.max(DiaryLimits.WaterGlassesMin, glasses)));
  }

  get litres(): number {
    return (this._value * DiaryLimits.WaterGlassMilliliters) / DiaryLimits.MillilitersPerLiter;
  }

  get canAdd(): boolean {
    return this._value < DiaryLimits.WaterGlassesMax;
  }

  get canRemove(): boolean {
    return this._value > DiaryLimits.WaterGlassesMin;
  }
}
