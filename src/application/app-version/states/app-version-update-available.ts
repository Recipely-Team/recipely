import type { AppVersionStatus } from '@application/app-version/app-version-status';
import type { VersionVerdict } from '@domain/app-version/version-verdict';

/** A newer release exists; the app stays usable under a dismissible prompt. */
export interface AppVersionUpdateAvailable {
  status: typeof AppVersionStatus.UpdateAvailable;
  verdict: VersionVerdict;
}
