import { VersionCheckStatus } from '@domain/app-version/version-check-status';

/**
 * The app version store's states: the backend's three verdicts plus
 * `Unchecked`, before the first answer or when it could not be had.
 */
export const AppVersionStatus = {
  ...VersionCheckStatus,
  Unchecked: 'unchecked',
} as const;
