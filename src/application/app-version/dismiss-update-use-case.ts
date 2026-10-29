import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';

/** Remembers that the user declined the optional update to `latestVersion`. */
export class DismissUpdateUseCase {
  constructor(private readonly preferences: PreferenceStoreInterface) {}

  execute(latestVersion: string): Promise<Result<void, Failure>> {
    return this.preferences.set(PreferenceSlot.DismissedUpdateVersion, latestVersion);
  }
}
