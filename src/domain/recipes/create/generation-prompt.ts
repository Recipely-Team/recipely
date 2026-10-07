import { BaseValueObject } from '@core/value-object/base-value-object';
import { mapResult } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { RequiredText } from '@domain/common/required-text';

/**
 * **Generation prompt** — the free text an AI recipe is generated from, trimmed and never blank.
 *
 * @remarks
 * - **Same key as the backend:** a blank prompt fails as `errors.validation.prompt_required`,
 *   the key the backend raises for the same rule, so presentation resolves one piece of copy.
 */
export class GenerationPrompt extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<GenerationPrompt, ValidationFailure> {
    const text = RequiredText.create(
      raw,
      () => new ValidationFailure(DiagnosticMessage.ai.promptRequired, undefined, ErrorMessageKey.promptRequired),
    );
    return mapResult(text, (t) => new GenerationPrompt(t.value));
  }
}
