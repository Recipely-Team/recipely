import type { Failure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';

export interface FeedbackStore {
  isSubmitting: boolean;
  /** `null` once sent, else this submission's own `Failure`; nothing is kept in the store for a later reader. */
  submit: (input: FeedbackSubmission) => Promise<Failure | null>;
}
