import type { FeatureFlagRepositoryInterface } from '@domain/flags/feature-flag-repository-interface';
import { FeatureFlags } from '@application/config/feature-flags';
import { isFeatureOn } from '@application/config/is-feature-on';
import type { FeatureFlagName } from '@application/config/feature-flag-name';

type FeatureFlagNameType = (typeof FeatureFlagName)[keyof typeof FeatureFlagName];

/**
 * Answers "is this feature on?" — the admin panel's override if it set one,
 * otherwise the build-time value in `FeatureFlags`.
 *
 * @remarks
 * - **Asked once per launch.** The first successful answer is kept for the
 *   session; a failed fetch is not, so the next question retries it.
 * - **Offline falls back to the build.** A network failure never hides or
 *   reveals a feature the build itself would not.
 */
export class FeatureFlagResolver {
  private overrides: Promise<Readonly<Record<string, boolean>> | null> | null = null;

  constructor(
    private readonly repo: FeatureFlagRepositoryInterface,
    private readonly isDevBuild: boolean,
  ) {}

  async isOn(name: FeatureFlagNameType): Promise<boolean> {
    const overrides = await this.loadOverrides();
    return overrides?.[name] ?? isFeatureOn(FeatureFlags[name], this.isDevBuild);
  }

  private loadOverrides(): Promise<Readonly<Record<string, boolean>> | null> {
    this.overrides ??= this.repo.fetchOverrides().then((result) => {
      if (result.ok) return result.value;
      this.overrides = null;
      return null;
    });
    return this.overrides;
  }
}
