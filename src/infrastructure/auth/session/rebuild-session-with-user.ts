import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { RecipelyUserDto } from '@infrastructure/auth/recipely-user-dto';
import { toUser } from '@infrastructure/auth/user-info-mapper';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * Rebuilds and persists the current session with a freshly-updated user.
 *
 * The avatar and profile endpoints return only the updated user (no token), so
 * the current session's token/expiry/id are reused to keep the user signed in.
 * Fails with `UnauthorizedFailure` when there is no active session to update.
 */
export const rebuildSessionWithUser = async (
  storage: SecureTokenStorage,
  userDto: RecipelyUserDto,
): Promise<Result<AuthSessionEntity, Failure>> => {
  const sessionResult = await storage.loadSession();
  if (!sessionResult.ok) {
    return fail(sessionResult.failure);
  }
  const current = sessionResult.value;
  if (current === null) {
    return fail(new UnauthorizedFailure('No active session to update'));
  }

  const userResult = toUser(userDto);
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
