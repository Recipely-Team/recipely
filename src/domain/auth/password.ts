import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { RegexConstants } from '@core/constants';

/** The shortest password the backend accepts. */
const MIN_LENGTH = 8;
/** The strength checks `strengthOf` counts: length, a capital, a digit, a symbol. */
const STRENGTH_CHECKS: readonly ((raw: string) => boolean)[] = [
  (raw) => raw.length >= MIN_LENGTH,
  (raw) => RegexConstants.hasUppercase.test(raw),
  (raw) => RegexConstants.hasDigit.test(raw),
  (raw) => RegexConstants.hasSymbol.test(raw),
];

/**
 * A password the backend will accept.
 *
 * @remarks
 * - **The one place the minimum length lives** — register and reset-password
 *   both ask `Password.create`, so the two screens can never disagree.
 * - **`strengthOf`** scores 0–4 for the strength meter; strength is advice,
 *   only the minimum length is a rule.
 */
export class Password extends BaseValueObject<string> {
  static readonly minLength = MIN_LENGTH;

  private constructor(raw: string) {
    super(raw);
  }

  static create(raw: string): Result<Password, ValidationFailure> {
    if (raw.length < MIN_LENGTH) {
      return fail(new ValidationFailure(DiagnosticMessage.auth.passwordTooShort, FailureField.password));
    }
    return ok(new Password(raw));
  }

  static strengthOf(raw: string): number {
    return STRENGTH_CHECKS.filter((check) => check(raw)).length;
  }
}
