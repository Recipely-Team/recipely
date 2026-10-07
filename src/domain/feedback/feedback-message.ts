import { BaseValueObject } from '@core/value-object/base-value-object';
import { mapResult } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import { RequiredText } from '@domain/common/required-text';

const MESSAGE_FIELD = 'message';

/**
 * **Feedback message** — a Help & Feedback submission ready to send: the message trimmed
 * and never blank, the subject trimmed.
 *
 * @remarks
 * - **Subject is optional:** an empty title is allowed and travels as an empty string.
 * - **`submission` is wire-ready**, so the backend never receives surrounding whitespace.
 * - **Equal when both fields are**, not only the message `value`.
 */
export class FeedbackMessage extends BaseValueObject<string> {
  private constructor(
    message: string,
    private readonly subject: string,
  ) {
    super(message);
  }

  static create(raw: FeedbackSubmission): Result<FeedbackMessage, ValidationFailure> {
    const message = RequiredText.create(
      raw.message,
      () => new ValidationFailure(DiagnosticMessage.feedback.messageRequired, MESSAGE_FIELD),
    );
    return mapResult(message, (m) => new FeedbackMessage(m.value, raw.subject.trim()));
  }

  get submission(): FeedbackSubmission {
    return { subject: this.subject, message: this.value };
  }

  equals(other: FeedbackMessage): boolean {
    return super.equals(other) && this.subject === other.subject;
  }
}
