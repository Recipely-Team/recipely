import { Failure } from '@core/failure/failure';
import type { ValidationFieldError } from '@core/failure/validation-field-error';

/**
 * Failure produced when user-supplied input does not pass domain or API
 * validation rules. The optional `field` names the offending input so the UI
 * can highlight the correct form control.
 *
 * The backend joins every failing field into one string on `message`, using
 * the format `"field1: msg1; field2: msg2"` (semicolon-space separated
 * segments, each `path: message` or just `message` when there is no path).
 * `field` only ever holds the first offending field for backward
 * compatibility; use `fieldErrors` to recover the full per-field breakdown.
 *
 * The widest subtype: the backend maps both `validation` (400) and
 * `unprocessable` (422) onto it, so `code` alone cannot say what went wrong.
 * The inherited `messageKey` disambiguates — e.g. `errors.validation.prompt_required`
 * vs. `errors.ai.prompt_rejected` vs. `errors.ai.invalid_response`.
 */
export class ValidationFailure extends Failure {
  readonly code = 'validation';
  constructor(
    readonly message: string,
    readonly field?: string,
    messageKey?: string,
  ) {
    super(messageKey);
  }

  /**
   * Splits `message` into structured per-field entries. Segments are
   * separated by `'; '`; within a segment, the first `': '` (if present)
   * separates the field name from its message — otherwise the whole segment
   * is treated as a fieldless message. Purely additive: `message`/`field`
   * keep working unchanged for existing callers.
   */
  get fieldErrors(): ValidationFieldError[] {
    return this.message.split('; ').map((segment) => {
      const separatorIndex = segment.indexOf(': ');
      if (separatorIndex === -1) {
        return { message: segment };
      }
      return {
        field: segment.slice(0, separatorIndex),
        message: segment.slice(separatorIndex + 2),
      };
    });
  }
}
