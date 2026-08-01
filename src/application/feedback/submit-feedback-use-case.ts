import { fail } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure, type Failure } from '@core/failure';
import type { FeedbackRepositoryInterface } from '@domain/feedback/feedback-repository-interface';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import { CharConstants } from '@core/constants';

/**
 * Submits user feedback via the Help & Feedback form.
 * Validates that `message` is non-empty before delegating to the repository.
 * Trims both `subject` and `message` before dispatch so the backend
 * does not receive leading/trailing whitespace.
 */
export class SubmitFeedbackUseCase {
  constructor(private readonly repo: FeedbackRepositoryInterface) {}

  async execute(input: FeedbackSubmission): Promise<Result<void, Failure>> {
    if (input.message.trim() === CharConstants.empty) {
      return fail(new ValidationFailure(DiagnosticMessage.feedback.messageRequired, 'message'));
    }

    return this.repo.submitFeedback({
      subject: input.subject.trim(),
      message: input.message.trim(),
    });
  }
}
