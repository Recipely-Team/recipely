import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import type { PreferenceSlotType } from '@domain/storage/preference-slot';

/** In-memory {@link PreferenceStoreInterface} double with synchronous `seed` / `peek` / `clear`. */
export class FakePreferenceStore implements PreferenceStoreInterface {
  private readonly entries = new Map<PreferenceSlotType, string>();

  get(slot: PreferenceSlotType): Promise<Result<string | null, Failure>> {
    return Promise.resolve(ok(this.entries.get(slot) ?? null));
  }

  set(slot: PreferenceSlotType, value: string): Promise<Result<void, Failure>> {
    this.entries.set(slot, value);
    return Promise.resolve(ok(undefined));
  }

  seed(slot: PreferenceSlotType, value: string): void {
    this.entries.set(slot, value);
  }

  peek(slot: PreferenceSlotType): string | null {
    return this.entries.get(slot) ?? null;
  }

  clear(): void {
    this.entries.clear();
  }
}
