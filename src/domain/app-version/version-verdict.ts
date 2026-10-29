import type { VersionCheckStatusType } from '@domain/app-version/version-check-status';
import type { UpdateRequiredReasonType } from '@domain/app-version/update-required-reason';

/** The backend's answer about this installed version. */
export interface VersionVerdict {
  readonly status: VersionCheckStatusType;
  /** Set only when `status` is `updateRequired`. */
  readonly reason: UpdateRequiredReasonType | null;
  readonly latestVersion: string | null;
  readonly minimumVersion: string | null;
  /** The store page to update from; `null` falls back to the build's own store link. */
  readonly storeUrl: string | null;
}
