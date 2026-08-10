import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import type { FeedbackStoreState } from '@application/feedback/feedback-store-state';
import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';

interface FeedbackStoreDeps {
  submitFeedbackUseCase: SubmitFeedbackUseCase;
}

/**
 * Creates the Zustand store for the Help & Feedback screen.
 * `submit` returns a boolean so the UI can trigger navigation on success
 * without reading store state in the same render cycle.
 */
export const configureFeedbackStore = (deps: FeedbackStoreDeps): BoundStore<FeedbackStoreState> => {
  const { submitFeedbackUseCase } = deps;

  return create<FeedbackStoreState>((set) => ({
    isSubmitting: false,
    error: null,
    submit: async (input: FeedbackSubmission): Promise<boolean> => {
      try {
        set({ isSubmitting: true, error: null });
        const result = await submitFeedbackUseCase.execute(input);
        if (!result.ok) {
          set({ isSubmitting: false, error: result.failure });
          return false;
        }
        set({ isSubmitting: false });
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        set({ isSubmitting: false, error: new UnknownFailure(errorMsg) });
        return false;
      }
    },
    reset: () => set({ isSubmitting: false, error: null }),
  }));
};
