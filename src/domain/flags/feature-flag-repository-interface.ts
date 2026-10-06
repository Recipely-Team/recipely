import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

/**
 * Port to the remote switches an admin sets over the app's feature flags.
 *
 * @remarks
 * - **Only overrides come back** — `{ flagName: enabled }` for the flags an admin
 *   forced on or off; a flag absent from the map keeps its build-time value.
 */
export interface FeatureFlagRepositoryInterface {
  fetchOverrides(): Promise<Result<Readonly<Record<string, boolean>>, Failure>>;
}
