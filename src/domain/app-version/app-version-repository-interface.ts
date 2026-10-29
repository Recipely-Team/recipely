import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { VersionVerdict } from '@domain/app-version/version-verdict';

/**
 * **App version port** — asks the backend what this installed build must do.
 *
 * @remarks
 * - **The adapter knows the build.** Platform and version come from the
 *   runtime, so callers ask without naming either; the web build is always
 *   current and answers `upToDate` without a request.
 */
export interface AppVersionRepositoryInterface {
  check(): Promise<Result<VersionVerdict, Failure>>;
}
