import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import type { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import type { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import type { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import type { SignOutUseCase } from '@application/auth/session/sign-out-use-case';
import type { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import type { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import type { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import type { RequestPasswordResetUseCase } from '@application/auth/password-reset/request-password-reset-use-case';
import type { ResetPasswordUseCase } from '@application/auth/password-reset/reset-password-use-case';
import type { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
import type { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import type { DeleteAccountUseCase } from '@application/auth/session/delete-account-use-case';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

interface AuthStoreDeps {
  signIn: SignInUseCase;
  requestRegistration: RequestRegistrationUseCase;
  verifyRegistration: VerifyRegistrationUseCase;
  resendRegistrationCode: ResendRegistrationCodeUseCase;
  signOut: SignOutUseCase;
  getSession: GetSessionUseCase;
  loadFavorites: LoadFavoritesUseCase;
  savedRecipesStore: BoundStore<SavedRecipesStoreState>;
  signInWithGoogle: SignInWithGoogleUseCase;
  signInWithApple: SignInWithAppleUseCase;
  requestPasswordReset: RequestPasswordResetUseCase;
  resetPassword: ResetPasswordUseCase;
  uploadAvatar: UploadAvatarUseCase;
  updateProfile: UpdateProfileUseCase;
  deleteAccount: DeleteAccountUseCase;
  /**
   * Clears every session-scoped cache (comments, likes, recipe details,
   * notifications, saved/created recipes, viewed profile) so nothing from the
   * previous account survives into the next session. Invoked on sign-out,
   * account deletion, and session expiry.
   */
  clearSessionCaches: () => void;
}

/**
 * The session store: hydration on cold start, sign-in / register / confirm, and
 * expiry.
 *
 * @remarks
 * - **Errors are page-scoped.** `AuthStoreState` has no error variant: an
 *   action returns the `Failure` and the screen holds it in local state, so a
 *   wrong password on the login page cannot surface anywhere else. A failed
 *   action returns the store to its resting status.
 * - **Only an authenticated session can expire** — a 401 during sign-in must
 *   not clobber the idle/loading/login flows, so `expireSession` is a no-op
 *   outside `authenticated`.
 * - **Sign-out clears the persisted session regardless of the `Result`**; the
 *   user is logging out either way and the routing decision follows the status.
 * - **Failures with no listener are dropped on purpose** — an unreadable
 *   persisted session on cold start is simply "logged out", and the background
 *   favorites pre-load leaves the saved overlay empty until something else
 *   loads it. Neither has a screen to report to.
 */
export const configureAuthStore = (deps: AuthStoreDeps): BoundStore<AuthStoreState> => {
  return create<AuthStoreState>((set, get) => ({
    state: { status: StoreStatus.Idle },

    expireSession: async () => {
      if (get().state.status !== StoreStatus.Authenticated) {
        return;
      }
      await deps.signOut.execute();
      set({ state: { status: StoreStatus.Unauthenticated } });
      deps.clearSessionCaches();
    },

    hydrate: async () => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.getSession.execute();
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return;
      }
      if (result.value === null || result.value.isExpired()) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      // Background pre-load; nothing waits on it.
      try {
        const favResult = await deps.loadFavorites.execute();
        if (favResult.ok) {
          deps.savedRecipesStore.getState().setSaved(favResult.value);
        }
      } catch {
        // Ignored: nothing is listening.
      }
    },

    signIn: async (email: string, password: string) => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.signIn.execute(email, password);
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    register: async (email: string, password: string, displayName: string) => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.requestRegistration.execute(email, password, displayName);
      // Account is not created yet — the user must confirm the emailed code.
      // On failure the Result carries the failure back to the screen; either
      // way the session stays unauthenticated.
      set({ state: { status: StoreStatus.Unauthenticated } });
      return result;
    },

    verifyRegistration: async (email: string, code: string) => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.verifyRegistration.execute(email, code);
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    resendRegistrationCode: async (email: string) => {
      // No global state change — the verify-code screen stays put; the Result
      // carries either the refreshed challenge or the failure back to it.
      return deps.resendRegistrationCode.execute(email);
    },

    signOut: async () => {
      // No `loading` transition: it would clobber the authenticated session,
      // and on failure we want to leave the user signed in. Mirrors
      // deleteAccount — the screen shows the returned failure and can retry.
      const result = await deps.signOut.execute();
      if (!result.ok) {
        return result.failure;
      }
      set({ state: { status: StoreStatus.Unauthenticated } });
      deps.clearSessionCaches();
      return null;
    },

    signInWithGoogle: async () => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.signInWithGoogle.execute();
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    signInWithApple: async () => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.signInWithApple.execute();
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    requestPasswordReset: async (email: string) => {
      const result = await deps.requestPasswordReset.execute(email);
      if (!result.ok) {
        return result.failure;
      }
      return null;
    },

    resetPassword: async (token: string, newPassword: string) => {
      const result = await deps.resetPassword.execute(token, newPassword);
      if (!result.ok) {
        // The reset screen owns its own error (page-scoped) — return the
        // failure without touching the global session state.
        return result.failure;
      }
      return null;
    },

    uploadAvatar: async (fileUri: string, fileName: string, mimeType: string) => {
      const result = await deps.uploadAvatar.execute(fileUri, fileName, mimeType);
      if (!result.ok) {
        // The user is still authenticated — surface the failure to the screen
        // without clobbering the session state.
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    updateProfile: async (input: { displayName?: string; bio?: string }) => {
      const result = await deps.updateProfile.execute(input);
      if (!result.ok) {
        // The user is still authenticated — surface the failure to the screen
        // without clobbering the session state.
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    },

    deleteAccount: async () => {
      const result = await deps.deleteAccount.execute();
      if (!result.ok) {
        // The account was not deleted — keep the user signed in and surface the
        // failure to the screen without clobbering the session state.
        return result.failure;
      }
      set({ state: { status: StoreStatus.Unauthenticated } });
      deps.clearSessionCaches();
      return null;
    },
  }));
};
