import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * The id of the user signed in right now, read before a request that rewrites
 * the session user goes out, so `replaceSessionUser` can refuse an answer that
 * lands for someone else. `UnauthorizedFailure` when nobody is signed in.
 */
export const signedInUserId = async (storage: SecureTokenStorage): Promise<Result<string, Failure>> => {
  const session = await storage.loadSession();
  if (!session.ok) return fail(session.failure);
  if (session.value === null) return fail(new UnauthorizedFailure(DiagnosticMessage.auth.noActiveSession));
  return ok(session.value.user.id);
};
