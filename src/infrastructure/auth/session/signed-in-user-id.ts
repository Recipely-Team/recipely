import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { signedInUser } from '@infrastructure/auth/session/signed-in-user';

/**
 * The id of the user signed in right now, read before a request that rewrites
 * the session user goes out, so `replaceSessionUser` can refuse an answer that
 * lands for someone else. `UnauthorizedFailure` when nobody is signed in.
 */
export const signedInUserId = async (storage: SecureTokenStorage): Promise<Result<string, Failure>> => {
  const user = await signedInUser(storage);
  return user.ok ? ok(user.value.id) : user;
};
