import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';
import { type Failure, UnknownFailure } from '@core/failure';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import type { FeedbackStore } from '@application/feedback/feedback-store-contract';
import type { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';

interface FeedbackStoreDeps {
  submitFeedbackUseCase: SubmitFeedbackUseCase;
}

/**
 * Sends Help & Feedback messages, from the sheet and from the assistant.
 *
 * @remarks
 * - **`submit` answers its own caller.** The store used to keep one `error`
 *   that the sheet read after its await; a report the assistant failed to send
 *   left that error behind, and the next time the user opened the sheet it
 *   showed somebody else's failure. Errors are page-scoped, as in the auth and
 *   favorites stores; only `isSubmitting` is shared.
 */
export const configureFeedbackStore = (deps: FeedbackStoreDeps): StoreApi<FeedbackStore> => {
  const { submitFeedbackUseCase } = deps;

  return createStore<FeedbackStore>((set) => ({
    isSubmitting: false,
    submit: async (input: FeedbackSubmission): Promise<Failure | null> => {
      set({ isSubmitting: true });
      try {
        const result = await submitFeedbackUseCase.execute(input);
        return result.ok ? null : result.failure;
      } catch (err) {
        return new UnknownFailure(err instanceof Error ? err.message : String(err), err);
      } finally {
        set({ isSubmitting: false });
      }
    },
  }));
};
