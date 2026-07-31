import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { UnknownFailure, type Failure } from '@core/failure';

/**
 * Runs a storage call and folds whatever it throws into a `Failure`.
 *
 * The platform APIs behind this port throw — `SecureStore` on a locked
 * keychain, `localStorage` in private browsing. This is the single place that
 * converts, so no caller above infrastructure ever sees an exception and the
 * port's `Result` contract holds for every backend.
 */
export const toStorageResult = async <T>(
  run: () => Promise<T>,
): Promise<Result<T, Failure>> => {
  try {
    return ok(await run());
  } catch (error) {
    return fail(new UnknownFailure(error instanceof Error ? error.message : String(error)));
  }
};
