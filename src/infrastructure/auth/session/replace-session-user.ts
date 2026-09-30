import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { UserEntity } from '@domain/auth/user-entity';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * Swaps the stored session's user for `update(current user)` and persists it,
 * keeping the token, expiry and id — only while `issuerId` is still the one
 * signed in.
 *
 * @remarks
 * - **For endpoints that answer without a token** — profile, avatar, creator
 *   claim. Each changes the user; none issues a new session.
 * - **Fails with `UnauthorizedFailure` when there is no stored session**, so a
 *   response that lands after sign-out cannot bring the session back.
 * - **Fails with `UnauthorizedFailure` when another user is signed in now.**
 *   `issuerId` is the user the request was sent for; an answer that lands
 *   after a sign-out and a sign-in as someone else is not theirs to keep.
 */
export const replaceSessionUser = async (
  storage: SecureTokenStorage,
  issuerId: string,
  update: (current: UserEntity) => Result<UserEntity, Failure>,
): Promise<Result<AuthSessionEntity, Failure>> => {
  const sessionResult = await storage.loadSession();
  if (!sessionResult.ok) {
    return fail(sessionResult.failure);
  }
  const current = sessionResult.value;
  if (current === null) {
    return fail(new UnauthorizedFailure(DiagnosticMessage.auth.noActiveSession));
  }
  if (current.user.id !== issuerId) {
    return fail(new UnauthorizedFailure(DiagnosticMessage.auth.sessionUserChanged));
  }

  const userResult = update(current.user);
  if (!userResult.ok) return userResult;

  const updatedResult = AuthSessionEntity.create({
    id: current.id,
    accessToken: current.accessToken,
    expiresAt: current.expiresAt,
    user: userResult.value,
  });
  if (!updatedResult.ok) return updatedResult;

  const saveResult = await storage.saveSession(updatedResult.value);
  if (!saveResult.ok) return fail(saveResult.failure);
  return ok(updatedResult.value);
};
