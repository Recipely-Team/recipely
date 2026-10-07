import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { ValidationFailure } from '@core/failure';
import { isBlank } from '@core/guards/type-guards';

/**
 * **Required text** — a piece of text that must say something: a prompt, a comment body,
 * a step.
 *
 * @remarks
 * - **Trimmed on the way in:** `value` never starts or ends with whitespace, so two
 *   inputs differing only in surrounding spaces are equal.
 * - **The caller names the failure:** `create` takes a factory for the `ValidationFailure`
 *   a blank input means, so each field reports its own `DiagnosticMessage` and field name
 *   (named value objects can be thin factories over this one).
 */
export class RequiredText extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string, failure: () => ValidationFailure): Result<RequiredText, ValidationFailure> {
    if (isBlank(raw)) return fail(failure());
    return ok(new RequiredText(raw.trim()));
  }
}
