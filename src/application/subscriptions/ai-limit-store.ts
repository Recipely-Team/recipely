import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { AiLimitStore } from '@application/subscriptions/ai-limit-store-contract';

/**
 * The free plan's AI-limit dialog, raised from any screen.
 *
 * @remarks
 * - **Fed by the HTTP client**, not by each screen: every AI endpoint can be
 *   refused for the cap, and a screen-by-screen check would miss the next one.
 * - **One dialog at a time.** A burst of refused requests (a retry, a second
 *   tab) shows the first refusal only, so the dialogs never stack.
 */
export const configureAiLimitStore = (): StoreApi<AiLimitStore> =>
  createStore<AiLimitStore>((set, get) => ({
    limit: null,
    report: (limit) => {
      if (get().limit === null) set({ limit });
    },
    dismiss: () => set({ limit: null }),
  }));
