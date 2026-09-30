import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';
import { toUser } from '@infrastructure/auth/user-info-mapper';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { replaceSessionUser } from '@infrastructure/auth/session/replace-session-user';

/**
 * Rebuilds and persists the current session with a freshly-updated user.
 *
 * The avatar and profile endpoints return only the updated user (no token), so
 * the current session's token/expiry/id are reused to keep the user signed in.
 * Fails with `UnauthorizedFailure` when there is no active session to update.
 * A user answer without a `creator` field (a backend older than creator tags)
 * keeps the stored claim: editing a bio must not clear it.
 */
export const rebuildSessionWithUser = (
  storage: SecureTokenStorage,
  userDto: RecipelyUserDto,
): Promise<Result<AuthSessionEntity, Failure>> =>
  replaceSessionUser(storage, (current) => {
    const user = toUser(userDto);
    if (!user.ok || userDto.creator !== undefined) return user;
    return ok(user.value.withCreatorClaim(current.creatorClaim));
  });
