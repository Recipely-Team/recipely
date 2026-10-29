import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AppVersionRepositoryInterface } from '@domain/app-version/app-version-repository-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { VersionCheckStatus } from '@domain/app-version/version-check-status';
import type { VersionVerdict } from '@domain/app-version/version-verdict';

/**
 * Asks the backend what this build must do, minus a prompt the user already declined.
 *
 * @remarks
 * - **"Not now" lasts one release.** An optional update whose `latestVersion`
 *   the user dismissed comes back as `upToDate`; the next release prompts again.
 * - **A required update ignores the dismissal** — nothing can opt out of it.
 */
export class CheckAppVersionUseCase {
  constructor(
    private readonly repo: AppVersionRepositoryInterface,
    private readonly preferences: PreferenceStoreInterface,
  ) {}

  async execute(): Promise<Result<VersionVerdict, Failure>> {
    const verdict = await this.repo.check();
    if (!verdict.ok || verdict.value.status !== VersionCheckStatus.UpdateAvailable) return verdict;
    const dismissed = await this.preferences.get(PreferenceSlot.DismissedUpdateVersion);
    const isDismissed = dismissed.ok && dismissed.value !== null && dismissed.value === verdict.value.latestVersion;
    return isDismissed ? ok({ ...verdict.value, status: VersionCheckStatus.UpToDate }) : verdict;
  }
}
