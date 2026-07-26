import { create } from 'zustand';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import { ONBOARDING_SEEN_STORAGE_KEY } from '@infrastructure/constants/storage';
import type { OnboardingStoreState } from '@application/onboarding/onboarding-store-state';

/** Persisted marker value written once the guest opts out of the onboarding gate. */
const SEEN_VALUE = '1';

/**
 * Module-scoped store (like {@link timerStore}/{@link alarmStore}) that tracks
 * whether the guest onboarding gate has been permanently dismissed. Backed by
 * the platform key-value store resolved lazily through DI, so no layer above
 * depends on a concrete storage backend.
 */
export const onboardingStore = create<OnboardingStoreState>((set) => ({
  hydrated: false,
  dismissed: false,
  hydrate: async (): Promise<void> => {
    try {
      const stored = await getKeyValueStore().getItem(ONBOARDING_SEEN_STORAGE_KEY);
      set({ hydrated: true, dismissed: stored === SEEN_VALUE });
    } catch {
      // A read failure must never block launch — fall back to "not dismissed"
      // (the gate shows) rather than leaving the redirect waiting forever.
      set({ hydrated: true, dismissed: false });
    }
  },
  dismiss: async (): Promise<void> => {
    set({ dismissed: true });
    try {
      await getKeyValueStore().setItem(ONBOARDING_SEEN_STORAGE_KEY, SEEN_VALUE);
    } catch {
      // Best-effort persistence: the in-memory flag already hides the gate for
      // this session even if the write fails.
    }
  },
}));
