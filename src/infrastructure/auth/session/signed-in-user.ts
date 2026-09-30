import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import type { UserEntity } from '@domain/auth/user-entity';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * The user signed in right now, as stored, read before a request that rewrites
 * the session user goes out. `UnauthorizedFailure` when nobody is signed in.
 */
export const signedInUser = async (storage: SecureTokenStorage): Promise<Result<UserEntity, Failure>> => {
  const session = await storage.loadSession();
  if (!session.ok) return fail(session.failure);
  if (session.value === null) return fail(new UnauthorizedFailure(DiagnosticMessage.auth.noActiveSession));
  return ok(session.value.user);
};
