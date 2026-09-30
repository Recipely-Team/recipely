import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { UserEntity } from '@domain/auth/user-entity';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * Swaps the stored session's user for `update(current user)` and persists it,
 * keeping the token, expiry and id.
 *
 * @remarks
 * - **For endpoints that answer without a token** — profile, avatar, creator
 *   claim. Each changes the user; none issues a new session.
 * - **Fails with `UnauthorizedFailure` when there is no stored session**, so a
 *   response that lands after sign-out cannot bring the session back.
 */
export const replaceSessionUser = async (
  storage: SecureTokenStorage,
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
