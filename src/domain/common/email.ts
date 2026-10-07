import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { RegexConstants } from '@core/constants';

/**
 * A validated email address.
 *
 * @remarks
 * Equality and `value` come from {@link BaseValueObject}: two `Email`s holding
 * the same address ARE the same email, which is what separates a value object
 * from an entity. `create` is the only way in — the constructor is private so
 * an unvalidated address cannot exist. Surrounding whitespace (a keyboard's
 * autocomplete space) is trimmed before validation: this is the one place an
 * address is normalised.
 */
export class Email extends BaseValueObject<string> {
  private constructor(raw: string) {
    super(raw);
  }

  static create(raw: string): Result<Email, ValidationFailure> {
    const address = raw.trim();
    if (!RegexConstants.email.test(address)) {
      return fail(new ValidationFailure(DiagnosticMessage.auth.invalidEmail, FailureField.email));
    }
    return ok(new Email(address));
  }
}
