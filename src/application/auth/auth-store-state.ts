import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import type { AuthStatus } from '@application/auth/auth-status';

export interface AuthStoreState {
  state: AuthStatus;
  /** Signs in with email + password. Returns `null` on success, or the `Failure` for the screen to surface. */
  signIn: (email: string, password: string) => Promise<Failure | null>;
  /**
   * Requests a verification code email. Returns the challenge (email +
   * code TTL) on success so the caller can open the verify-code step, or the
   * `Failure` for the screen to surface — the error is page-local, never global.
   */
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<Result<RegistrationChallenge, Failure>>;
  /** Confirms the emailed code and, on success, authenticates the session. Returns `null` on success or the `Failure`. */
  verifyRegistration: (email: string, code: string) => Promise<Failure | null>;
  /** Re-sends the registration code; returns the refreshed challenge or the `Failure` for the screen. */
  resendRegistrationCode: (email: string) => Promise<Result<RegistrationChallenge, Failure>>;
  /** Signs out. Returns `null` on success (session cleared) or the `Failure`, leaving the session intact. */
  signOut: () => Promise<Failure | null>;
  /**
   * Reacts to a 401 from the backend on an authenticated session: clears the
   * persisted session and flips the store to `unauthenticated` so the auth
   * guard redirects to login. No-op unless the current status is
   * `authenticated` — it must never clobber an idle/loading/login flow (e.g. a
   * wrong-password 401 during sign-in). There is no token-refresh path on the
   * backend, so an expired/invalid JWT is terminal for the session.
   */
  expireSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  /** Returns `null` on success or the `Failure` for the screen to surface. */
  signInWithGoogle: () => Promise<Failure | null>;
  /** Returns `null` on success or the `Failure` for the screen to surface. */
  signInWithApple: () => Promise<Failure | null>;
  /** Sends a reset-link email; returns `null` on success or the `Failure` so the screen can show its own error. */
  requestPasswordReset: (email: string) => Promise<Failure | null>;
  /** Completes a password reset; returns null on success or the Failure so the screen can show a specific message. */
  resetPassword: (token: string, newPassword: string) => Promise<Failure | null>;
  /** Uploads a new profile photo; on success updates the session. Returns null on success or the Failure for the screen to toast. */
  uploadAvatar: (fileUri: string, fileName: string, mimeType: string) => Promise<Failure | null>;
  /** Updates the display name / bio; on success updates the session. Returns null on success or the Failure for the screen to toast. */
  updateProfile: (input: { displayName?: string; bio?: string }) => Promise<Failure | null>;
  /**
   * Permanently deletes the signed-in user's account and all its data. On
   * success flips the store to `unauthenticated` and clears saved recipes,
   * returning null. On failure the session is left intact (the screen shows the
   * returned Failure) so the user can retry.
   */
  deleteAccount: () => Promise<Failure | null>;
}
