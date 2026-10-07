import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FeedbackRepositoryInterface } from '@domain/feedback/feedback-repository-interface';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import { FeedbackMessage } from '@domain/feedback/feedback-message';

/**
 * Submits user feedback via the Help & Feedback form. {@link FeedbackMessage}
 * rejects a blank message and trims both fields before dispatch.
 */
export class SubmitFeedbackUseCase {
  constructor(private readonly repo: FeedbackRepositoryInterface) {}

  async execute(input: FeedbackSubmission): Promise<Result<void, Failure>> {
    const feedback = FeedbackMessage.create(input);
    return feedback.ok ? this.repo.submitFeedback(feedback.value.submission) : fail(feedback.failure);
  }
}
