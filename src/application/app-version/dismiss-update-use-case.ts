import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { UpdateSnooze } from '@domain/app-version/update-snooze';

/** "Not now" on the optional update prompt: snoozes it for `UPDATE_SNOOZE_MS`. */
export class DismissUpdateUseCase {
  constructor(
    private readonly preferences: PreferenceStoreInterface,
    private readonly now: () => number = Date.now,
  ) {}

  execute(): Promise<Result<void, Failure>> {
    return this.preferences.set(PreferenceSlot.UpdateSnoozedUntil, UpdateSnooze.startingAt(this.now()).serialize());
  }
}
