import type { AppVersionUnchecked } from '@application/app-version/states/app-version-unchecked';
import type { AppVersionUpToDate } from '@application/app-version/states/app-version-up-to-date';
import type { AppVersionUpdateAvailable } from '@application/app-version/states/app-version-update-available';
import type { AppVersionUpdateRequired } from '@application/app-version/states/app-version-update-required';

/** What the app version store knows about this build. */
export type AppVersionState =
  | AppVersionUnchecked
  | AppVersionUpToDate
  | AppVersionUpdateAvailable
  | AppVersionUpdateRequired;
