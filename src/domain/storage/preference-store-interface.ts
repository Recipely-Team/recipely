import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PreferenceSlotType } from '@domain/storage/preference-slot';

/**
 * **Preference store port** — reads and writes one string value per {@link PreferenceSlotType}.
 *
 * @remarks
 * - **Absent vs failed:** `get` answers `ok(null)` for an unset slot, a `Failure` for a broken read.
 * - **Keys:** the adapter maps each slot to its storage key; callers never name one.
 */
export interface PreferenceStoreInterface {
  get(slot: PreferenceSlotType): Promise<Result<string | null, Failure>>;
  set(slot: PreferenceSlotType, value: string): Promise<Result<void, Failure>>;
}
