import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { UserProfileStoreState } from '@application/user-profile/user-profile-store-state';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';

interface UserProfileStoreDeps {
  getUserProfile: GetUserProfileUseCase;
}

/**
 * Holds the currently-viewed user profile (typically the signed-in user).
 * The screen that mounts the profile is responsible for calling `load`; the
 * store is intentionally session-scoped and is cleared on sign-out via `reset`.
 */
export const configureUserProfileStore = (
  deps: UserProfileStoreDeps,
): BoundStore<UserProfileStoreState> => {
  return create<UserProfileStoreState>((set) => ({
    state: { status: 'idle' }, // TO DO: static status name problem
    load: async (userId: string) => {
      set({ state: { status: 'loading' } }); // TO DO: static status name problem
      const result = await deps.getUserProfile.execute({ userId });
      if (!result.ok) {
        set({ state: { status: 'error', failure: result.failure } }); // TO DO: static status name problem
        return;
      }
      set({ state: { status: 'loaded', profile: result.value } }); // TO DO: static status name problem
    },
    reset: () => set({ state: { status: 'idle' } }),
  }));
};
