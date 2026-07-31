import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { UserProfileStoreState } from '@application/user-profile/user-profile-store-state';
import type { UserProfileStoreDeps } from '@application/user-profile/user-profile-store-deps';

/**
 * Holds the currently-viewed user profile (typically the signed-in user).
 * The screen that mounts the profile is responsible for calling `load`; the
 * store is intentionally session-scoped and is cleared on sign-out via `reset`.
 */
export const configureUserProfileStore = (
  deps: UserProfileStoreDeps,
): BoundStore<UserProfileStoreState> => {
  return create<UserProfileStoreState>((set) => ({
    state: { status: 'idle' },
    load: async (userId: string) => {
      set({ state: { status: 'loading' } });
      const result = await deps.getUserProfile.execute({ userId });
      if (!result.ok) {
        set({ state: { status: 'error', failure: result.failure } });
        return;
      }
      set({ state: { status: 'loaded', profile: result.value } });
    },
    reset: () => set({ state: { status: 'idle' } }),
  }));
};
