import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { RegexConstants } from '@core/constants';

/**
 * Value object wrapping a validated email address string. Use `Email.create` to
 * parse and validate; the constructor is intentionally private to prevent
 * unvalidated instances from being created.
 */
export class Email {
  private constructor(private readonly raw: string) {}

  static create(raw: string): Result<Email, ValidationFailure> {
    if (!RegexConstants.email.test(raw)) {
      return fail(new ValidationFailure('Invalid email format', 'email'));
    }
    return ok(new Email(raw));
  }

  get value(): string {
    return this.raw;
  }
} // TO DO: Email sınıfı yerine EmailValueObject gibi bir isimlendirme yapılabilir. Value Object Base sınnıfı varsa ondan türemeli yoksa üretelim ve ondan türetelim
