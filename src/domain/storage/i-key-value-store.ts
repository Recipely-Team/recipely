import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

/**
 * Port for simple string key-value persistence. Implemented per platform in the
 * infrastructure layer (secure store on native, `localStorage` on web) and
 * resolved by consumers through the DI container so no layer above depends on a
 * concrete storage backend.
 *
 * Every method returns a `Result` because storage genuinely fails: a keychain
 * can refuse access, a disk can be full, a web `localStorage` can be disabled
 * in private browsing. `getItem` previously answered `null` for both "no value
 * stored" and "the read blew up", and callers could not tell a first launch
 * from a broken keychain.
 */
export interface IKeyValueStore {
  /** `ok(null)` when the key is absent — distinct from a failed read. */
  getItem(key: string): Promise<Result<string | null, Failure>>;
  setItem(key: string, value: string): Promise<Result<void, Failure>>;
  removeItem(key: string): Promise<Result<void, Failure>>;
}
