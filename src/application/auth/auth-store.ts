import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { ClaimWriteQueue } from '@application/auth/claim-write-queue';
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
 *   both platforms together cannot lose one ({@link ClaimWriteQueue}).
 */
export const configureAuthStore = (deps: AuthStoreDeps): BoundStore<AuthStoreState> => {
  const claims = new ClaimWriteQueue();

  return create<AuthStoreState>((set, get) => {
    type SessionCall = () => Promise<Result<AuthSessionEntity, Failure>>;

    /** The signed-in user's id, or `null` — read when a claim call starts. */
    const sessionUserId = (): string | null => {
      const { state } = get();
      return state.status === StoreStatus.Authenticated ? state.session.user.id : null;
    };

    /** Loading, then the session the call answers with — or back to logged out and its failure. */
    const authenticate = async (call: SessionCall): Promise<Failure | null> => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await call();
      if (!result.ok) {
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result.failure;
      }
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    };

    /** Replaces the signed-in session with the call's answer; a failure keeps the old one. */
    const updateSession = async (call: SessionCall): Promise<Failure | null> => {
      const result = await call();
      if (!result.ok) return result.failure;
      set({ state: { status: StoreStatus.Authenticated, session: result.value } });
      return null;
    };

    /**
     * Runs a claim action for the user signed in now and applies its session
     * only if that user still is and `isCurrent()` still holds; `null` on
     * success. An answer for a user who has signed out since is nobody's:
     * dropped, failure and all.
     */
    const applyClaimResult = async (
      call: SessionCall,
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
        if (!result.ok || result.value === null) {
          set({ state: { status: StoreStatus.Unauthenticated } });
          return;
        }
        set({ state: { status: StoreStatus.Authenticated, session: result.value } });
        deps.onSessionRestored();
        // Background pre-load; nothing waits on it.
        const favorites = await deps.loadFavorites.execute();
        if (favorites.ok) {
          deps.savedRecipesStore.getState().setSaved(favorites.value);
        }
      },

      signIn: (email: string, password: string) => authenticate(() => deps.signIn.execute(email, password)),

      register: async (email: string, password: string, displayName: string) => {
        set({ state: { status: StoreStatus.Loading } });
        const result = await deps.requestRegistration.execute(email, password, displayName);
        // Not created until the emailed code is confirmed; the session stays unauthenticated.
        set({ state: { status: StoreStatus.Unauthenticated } });
        return result;
      },

      verifyRegistration: (email: string, code: string) =>
        authenticate(() => deps.verifyRegistration.execute(email, code)),

      resendRegistrationCode: async (email: string) => {
        // The verify-code screen handles the result; no global state change.
        return deps.resendRegistrationCode.execute(email);
      },

      signOut: async () => {
        // No loading state: a failed sign-out leaves the user signed in.
        const result = await deps.signOut.execute();
        if (!result.ok) {
          return result.failure;
        }
        set({ state: { status: StoreStatus.Unauthenticated } });
        deps.clearSessionCaches();
        return null;
      },

      signInWithGoogle: () => authenticate(() => deps.signInWithGoogle.execute()),

      signInWithApple: () => authenticate(() => deps.signInWithApple.execute()),

      requestPasswordReset: async (email: string) => {
        const result = await deps.requestPasswordReset.execute(email);
        return result.ok ? null : result.failure;
      },

      resetPassword: async (token: string, newPassword: string) => {
        // Page-scoped error: the reset screen owns it.
        const result = await deps.resetPassword.execute(token, newPassword);
        return result.ok ? null : result.failure;
      },

      uploadAvatar: (fileUri: string, fileName: string, mimeType: string) =>
        updateSession(() => deps.uploadAvatar.execute(fileUri, fileName, mimeType)),

      updateProfile: (input: { displayName?: string; bio?: string }) =>
        updateSession(() => deps.updateProfile.execute(input)),

      deleteAccount: async () => {
        const result = await deps.deleteAccount.execute();
        if (!result.ok) {
          // Not deleted: keep the session, return the failure.
          return result.failure;
        }
        set({ state: { status: StoreStatus.Unauthenticated } });
        deps.clearSessionCaches();
        return null;
      },

      requestCreatorTag: (input) =>
        claims.write(() => applyClaimResult(() => deps.requestCreatorTag.execute(input))),

      removeCreatorTag: (platform) =>
        claims.write(() => applyClaimResult(() => deps.removeCreatorTag.execute(platform))),

      refreshCreatorClaim: () =>
        claims.refresh((isCurrent) => applyClaimResult(() => deps.refreshCreatorClaim.execute(), isCurrent)),
    };
  });
};
