import { BaseValueObject } from '@core/value-object/base-value-object';
import { mapResult } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { RequiredText } from '@domain/common/required-text';

/**
 * **Refine instruction** — what the user wants changed in a recipe already on screen,
 * trimmed and never blank.
 *
 * @remarks
 * - **Its own key, not the prompt's:** a blank instruction fails as
 *   `errors.ai.refine_instruction_required` — with a recipe on screen the user must be told
 *   what to CHANGE, not what to cook.
 */
export class RefineInstruction extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<RefineInstruction, ValidationFailure> {
    const text = RequiredText.create(
      raw,
      () =>
        new ValidationFailure(
          DiagnosticMessage.ai.refineInstructionRequired,
          undefined,
          ErrorMessageKey.refineInstructionRequired,
        ),
    );
    return mapResult(text, (t) => new RefineInstruction(t.value));
  }
}
