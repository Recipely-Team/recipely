import type { AppVersionStatus } from '@application/app-version/app-version-status';
import type { VersionVerdict } from '@domain/app-version/version-verdict';

/** This build is unsupported or pulled; the whole app is replaced by the update gate. */
export interface AppVersionUpdateRequired {
  status: typeof AppVersionStatus.UpdateRequired;
  verdict: VersionVerdict;
}
