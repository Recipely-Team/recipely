import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot, type PreferenceSlotType } from '@domain/storage/preference-slot';
import {
  LANGUAGE_STORAGE_KEY,
  ONBOARDING_SEEN_STORAGE_KEY,
  FIRST_OPEN_AT_STORAGE_KEY,
  REMINDERS_CHOICE_STORAGE_KEY,
  TIMERS_STORAGE_KEY,
} from '@infrastructure/constants/storage';

/** Slot → persisted key. Changing a key here silently resets that setting for every user. */
const KEY_BY_SLOT: Record<PreferenceSlotType, string> = {
  [PreferenceSlot.Timers]: TIMERS_STORAGE_KEY,
  [PreferenceSlot.Language]: LANGUAGE_STORAGE_KEY,
  [PreferenceSlot.OnboardingSeen]: ONBOARDING_SEEN_STORAGE_KEY,
  [PreferenceSlot.RemindersChoice]: REMINDERS_CHOICE_STORAGE_KEY,
  [PreferenceSlot.FirstOpenAt]: FIRST_OPEN_AT_STORAGE_KEY,
};

/**
 * **Preference store adapter** — {@link PreferenceStoreInterface} over the platform key-value store.
 *
 * @remarks
 * - **Platforms:** wraps `KeyValueStoreInterface`, whose `kv-store` pair already splits native/web.
 */
export class PreferenceStore implements PreferenceStoreInterface {
  constructor(private readonly kv: KeyValueStoreInterface) {}

  get(slot: PreferenceSlotType): Promise<Result<string | null, Failure>> {
    return this.kv.getItem(KEY_BY_SLOT[slot]);
  }

  set(slot: PreferenceSlotType, value: string): Promise<Result<void, Failure>> {
    return this.kv.setItem(KEY_BY_SLOT[slot], value);
  }
}
