import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AppVersionRepositoryInterface } from '@domain/app-version/app-version-repository-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { VersionCheckStatus } from '@domain/app-version/version-check-status';
import { UpdateSnooze } from '@domain/app-version/update-snooze';
import type { VersionVerdict } from '@domain/app-version/version-verdict';

/**
 * Asks the backend what this build must do, minus a prompt the user snoozed.
 *
 * @remarks
 * - **"Not now" lasts a while, then asks again** (`UpdateSnooze`): an optional
 *   update inside the snooze comes back as `upToDate`.
 * - **A required update ignores the snooze** — nothing can opt out of it.
 */
export class CheckAppVersionUseCase {
  constructor(
    private readonly repo: AppVersionRepositoryInterface,
    private readonly preferences: PreferenceStoreInterface,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(): Promise<Result<VersionVerdict, Failure>> {
    const verdict = await this.repo.check();
    if (!verdict.ok || verdict.value.status !== VersionCheckStatus.UpdateAvailable) return verdict;
    const stored = await this.preferences.get(PreferenceSlot.UpdateSnoozedUntil);
    const snooze = stored.ok ? UpdateSnooze.parse(stored.value) : null;
    return snooze?.isActiveAt(this.now()) === true ? ok({ ...verdict.value, status: VersionCheckStatus.UpToDate }) : verdict;
  }
}
