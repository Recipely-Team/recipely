import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';

/**
 * Contract for submitting user feedback to the backend.
 * The implementation is responsible for mapping `FeedbackSubmission` to the
 * wire format and handling transport-level errors.
 */
export interface FeedbackRepositoryInterface {
  /**
   * Sends a feedback submission to the backend.
   * Returns `ok(void)` on success; the server ignores the response body.
   * Returns `fail(Failure)` for network, auth, or validation errors.
   */
  submitFeedback(input: FeedbackSubmission): Promise<Result<void, Failure>>;
}
