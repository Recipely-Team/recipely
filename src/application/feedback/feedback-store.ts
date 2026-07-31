import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import type { FeedbackStoreState } from '@application/feedback/feedback-store-state';
import type { FeedbackStoreDeps } from '@application/feedback/feedback-store-deps';

/**
 * Creates the Zustand store for the Help & Feedback screen.
 * `submit` returns a boolean so the UI can trigger navigation on success
 * without reading store state in the same render cycle.
 */
export const configureFeedbackStore = (deps: FeedbackStoreDeps): FeedbackStore => {
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

/** Bound Zustand store handle produced by `configureFeedbackStore`. */
export type FeedbackStore = UseBoundStore<StoreApi<FeedbackStoreState>>;
