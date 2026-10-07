import { BaseValueObject } from '@core/value-object/base-value-object';
import { mapResult } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { RequiredText } from '@domain/common/required-text';

const BODY_FIELD = 'body';

/**
 * **Comment body** — what a viewer writes under a recipe, trimmed and never blank.
 *
 * @remarks
 * - **Validated before the request:** `AddCommentUseCase` builds one, so a blank body
 *   fails locally with the same `ValidationFailure` `CommentEntity.create` would raise.
 */
export class CommentBody extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<CommentBody, ValidationFailure> {
    const text = RequiredText.create(
      raw,
      () => new ValidationFailure(DiagnosticMessage.entity.comment.bodyRequired, BODY_FIELD),
    );
    return mapResult(text, (t) => new CommentBody(t.value));
  }
}
