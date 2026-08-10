import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
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
    state: { status: StoreStatus.Idle },
    load: async (userId: string) => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.getUserProfile.execute({ userId });
      if (!result.ok) {
        set({ state: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      set({ state: { status: StoreStatus.Loaded, profile: result.value } });
    },
    reset: () => set({ state: { status: StoreStatus.Idle } }),
  }));
};
