import type { AppVersionStatus } from '@application/app-version/app-version-status';

/** Current, or the user already dismissed this release's prompt: nothing is shown. */
export interface AppVersionUpToDate {
  status: typeof AppVersionStatus.UpToDate;
}
