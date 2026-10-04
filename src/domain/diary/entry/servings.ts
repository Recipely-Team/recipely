import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { DiaryLimits } from '@domain/diary/diary-limits';

/**
 * How many servings the user is logging — the Add food sheet's stepper value.
 *
 * @remarks
 * - **0.5 steps from 0.5 to 20** (design spec §6; backend `ServingsMax`).
 * - **The stepper clamps, it never fails**: `increment` / `decrement` at a
 *   bound return the same value, and `canIncrement` / `canDecrement` say
 *   whether the button should be enabled.
 * - Entries read back from the server are NOT forced through this: an entry
 *   logged elsewhere may hold any positive amount, and refusing to show it
 *   would hide real food from the day.
 */
export class Servings extends BaseValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(raw: number): Result<Servings, ValidationFailure> {
    const steps = raw / DiaryLimits.ServingsStep;
    if (!Number.isInteger(steps) || raw < DiaryLimits.ServingsMin || raw > DiaryLimits.ServingsMax) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.servingsOffStep, 'servings'));
    }
    return ok(new Servings(raw));
  }

  static one(): Servings {
    return new Servings(ValueConstants.one);
  }

  /** The nearest valid amount to `raw` — for pre-filling the stepper from an arbitrary entry. */
  static nearest(raw: number): Servings {
    const stepped = Math.round(raw / DiaryLimits.ServingsStep) * DiaryLimits.ServingsStep;
    return new Servings(Math.min(DiaryLimits.ServingsMax, Math.max(DiaryLimits.ServingsMin, stepped)));
  }

  get canIncrement(): boolean {
    return this._value < DiaryLimits.ServingsMax;
  }

  get canDecrement(): boolean {
    return this._value > DiaryLimits.ServingsMin;
  }

  increment(): Servings {
    return this.canIncrement ? new Servings(this._value + DiaryLimits.ServingsStep) : this;
  }

  decrement(): Servings {
    return this.canDecrement ? new Servings(this._value - DiaryLimits.ServingsStep) : this;
  }
}
