import type { AppVersionStatus } from '@application/app-version/app-version-status';

/** No answer yet, or the check failed: the app runs as normal (fail open). */
export interface AppVersionUnchecked {
  status: typeof AppVersionStatus.Unchecked;
}
