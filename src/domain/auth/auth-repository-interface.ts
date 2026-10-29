import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';

/**
 * Signing in and keeping the session: credentials, registration, password reset,
 * and the stored session's lifecycle. What the signed-in user changes about their
 * account lives in `AccountRepositoryInterface`; creator tags in
 * `CreatorClaimRepositoryInterface`.
 */
export interface AuthRepositoryInterface {
  signIn(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>>;
  /**
   * Starts registration by sending a verification code to `email`. Does NOT
   * create the account or a session — resolve the returned challenge with
   * `verifyRegistration` to complete sign-up.
   */
  requestRegistration(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Result<RegistrationChallenge, Failure>>;
  /** Confirms the emailed code and, on success, creates the account + session. */
  verifyRegistration(email: string, code: string): Promise<Result<AuthSessionEntity, Failure>>;
  /** Finishes a registration from the emailed link's token, with no code. */
  verifyRegistrationLink(token: string): Promise<Result<AuthSessionEntity, Failure>>;
  /** Re-sends the registration code to a pending email. */
  resendRegistrationCode(email: string): Promise<Result<RegistrationChallenge, Failure>>;
  signOut(): Promise<Result<void, Failure>>;
  getCurrentSession(): Promise<Result<AuthSessionEntity | null, Failure>>;
  signInWithGoogle(): Promise<Result<AuthSessionEntity, Failure>>;
  signInWithApple(): Promise<Result<AuthSessionEntity, Failure>>;
  /**
   * Sends a password-reset link to `email`. Resolves ok even when the email
   * is not registered — enumeration-safe by design.
   */
  requestPasswordReset(email: string): Promise<Result<void, Failure>>;
  /**
   * Completes a password reset using the token from the emailed link. Does
   * NOT create a new session — the user must sign in after resetting.
   */
  resetPassword(token: string, newPassword: string): Promise<Result<void, Failure>>;
}
