import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';

export interface FeedbackStoreDeps {
  submitFeedbackUseCase: SubmitFeedbackUseCase;
}
