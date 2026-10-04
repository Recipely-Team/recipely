import { BaseValueObject } from '@core/value-object/base-value-object';
import { CharConstants } from '@core/constants';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import { CreatorHandleRules } from '@domain/creators/creator-handle-rules';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';

/**
 * An Instagram or TikTok account name, normalised and checked against the
 * contract's rules for its platform.
 *
 * @remarks
 * - **Normalises before it validates.** Surrounding whitespace and one leading
 *   `@` go, then it is lower-cased — so `@Chef.Ada` is stored as `chef.ada`,
 *   and two spellings of one account compare equal.
 * - **A failure carries `errors.validation.creator_handle`**, the key the
 *   server answers with, so a handle refused before sending reads exactly like
 *   one refused after.
 * - **`value` has no `@`**; `display` adds it back for the screen.
 */
export class CreatorHandle extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string, platform: CreatorPlatformType): Result<CreatorHandle, ValidationFailure> {
    const handle = CreatorHandle.normalize(raw);
    if (!CreatorHandle.isValid(handle, platform)) {
      return fail(
        new ValidationFailure(
          DiagnosticMessage.creator.handleInvalid(platform),
          FailureField.creatorHandle,
          ErrorMessageKey.creatorHandleInvalid,
        ),
      );
    }
    return ok(new CreatorHandle(handle));
  }

  /** Trimmed, one leading `@` removed, lower-cased — what the server stores. */
  static normalize(raw: string): string {
    const trimmed = raw.trim();
    const bare = trimmed.startsWith(CreatorHandleRules.Prefix)
      ? trimmed.slice(CreatorHandleRules.Prefix.length)
      : trimmed;
    return bare.toLowerCase();
  }

  /**
   * What the handle field keeps of a keystroke or a paste: no spaces and no
   * leading `@` — the field draws its own `@`. Case is left for `normalize`.
   */
  static sanitizeInput(raw: string): string {
    const typed = raw.split(CharConstants.space).join(CharConstants.empty);
    return typed.startsWith(CreatorHandleRules.Prefix) ? typed.slice(CreatorHandleRules.Prefix.length) : typed;
  }

  /** Whether a handle is long enough to send for review on its platform — the form's Submit gate. */
  static meetsMinimum(raw: string, platform: CreatorPlatformType): boolean {
    return CreatorHandle.normalize(raw).length >= CreatorHandleRules.Length[platform].Min;
  }

  /** `@handle`, the way both platforms print an account. */
  get display(): string {
    return `${CreatorHandleRules.Prefix}${this._value}`;
  }

  private static isValid(handle: string, platform: CreatorPlatformType): boolean {
    const { Min, Max } = CreatorHandleRules.Length[platform];
    return (
      handle.length >= Min &&
      handle.length <= Max &&
      CreatorHandleRules.Charset.test(handle) &&
      !handle.startsWith(CreatorHandleRules.Dot) &&
      !handle.endsWith(CreatorHandleRules.Dot) &&
      !handle.includes(CreatorHandleRules.DoubleDot)
    );
  }
}
