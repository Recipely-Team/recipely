import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
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
import type { RequestCreatorTagUseCase } from '@application/creators/claim/request-creator-tag-use-case';
import type { RemoveCreatorTagUseCase } from '@application/creators/claim/remove-creator-tag-use-case';
import type { RefreshCreatorClaimUseCase } from '@application/creators/claim/refresh-creator-claim-use-case';
import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';

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
  requestCreatorTag: RequestCreatorTagUseCase;
  removeCreatorTag: RemoveCreatorTagUseCase;
  refreshCreatorClaim: RefreshCreatorClaimUseCase;
  /**
   * Clears every session-scoped cache (comments, likes, recipe details,
   * notifications, saved/created recipes, viewed profile) so nothing from the
   * previous account survives into the next session. Invoked on sign-out,
   * account deletion, and session expiry.
   */
  clearSessionCaches: () => void;
  /**
   * Called once `hydrate` has restored a stored session — the device heartbeat.
   * Never after an interactive sign-in: those send the device in their body.
   */
  onSessionRestored: () => void;
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
 * - **The creator claim lives on the session user.** Request, remove and
 *   refresh each answer with the rebuilt session; it is applied only while the
 *   user who started the call is still the one signed in, so an answer landing
 *   after sign-out cannot sign anyone back in, nor put one user's claim on the
 *   next user's session. A refresh is dropped when a request or remove was
 *   still in flight as it started or started while it ran: it read the claim
 *   from before the change. Writes run one at a time, in order, so writing
 *   both platforms together cannot lose one.
 */
export const configureAuthStore = (deps: AuthStoreDeps): BoundStore<AuthStoreState> => {
  // Bumped by each request / remove, so a refresh can tell it was overtaken.
  let claimWrites = ValueConstants.zero;
  // Requests / removes not answered yet: a refresh started under one read the claim from before it.
  let claimWritesInFlight = ValueConstants.zero;
  // The tail of the claim-write queue; each write starts when the one before it has settled.
  let claimQueue: Promise<void> = Promise.resolve();

  return create<AuthStoreState>((set, get) => {
    /** The signed-in user's id, or `null` — read when a claim call starts. */
    const sessionUserId = (): string | null => {
      const { state } = get();
      return state.status === StoreStatus.Authenticated ? state.session.user.id : null;
    };

    /**
     * Runs a claim action for the user signed in now and applies its session
     * only if that user still is and `isCurrent()` still holds; `null` on
     * success. An answer for a user who has signed out since is nobody's:
     * dropped, failure and all.
     */
    const applyClaimResult = async (
      call: () => Promise<Result<AuthSessionEntity, Failure>>,
      isCurrent: () => boolean = () => true,
    ): Promise<Failure | null> => {
      const issuer = sessionUserId();
      const result = await call();
      if (issuer === null) return result.ok ? null : result.failure;
      if (sessionUserId() !== issuer || !isCurrent()) return null;
      if (!result.ok) return result.failure;
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    };

    /** Runs a request / remove, counted from its start until its answer is handled. */
    /**
     * Runs claim writes one at a time, in the order they were asked for: two
     * platforms written together would otherwise each answer with a session
     * built before the other's write, and the later answer would drop one.
     * Counted as in flight from the moment it is queued, so a refresh started
     * meanwhile knows it was overtaken.
     */
    const writeClaim = (call: () => Promise<Result<AuthSessionEntity, Failure>>): Promise<Failure | null> => {
      claimWrites += ValueConstants.one;
      claimWritesInFlight += ValueConstants.one;
      const run = claimQueue.then(() => applyClaimResult(call)).finally(() => {
        claimWritesInFlight -= ValueConstants.one;
      });
      claimQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    };

    return {
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
        deps.onSessionRestored();
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

      requestCreatorTag: (input) => writeClaim(() => deps.requestCreatorTag.execute(input)),

      removeCreatorTag: (platform) => writeClaim(() => deps.removeCreatorTag.execute(platform)),

      refreshCreatorClaim: () => {
        const startedAfter = claimWrites;
        const startedIdle = claimWritesInFlight === ValueConstants.zero;
        return applyClaimResult(
          () => deps.refreshCreatorClaim.execute(),
          () => startedIdle && claimWrites === startedAfter,
        );
      },
    };
  });
};
