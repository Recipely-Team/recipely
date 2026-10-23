import type { CreatorProfileIdle } from '@application/creators/profile/states/creator-profile-idle';
import type { CreatorProfileLoading } from '@application/creators/profile/states/creator-profile-loading';
import type { CreatorProfileLoaded } from '@application/creators/profile/states/creator-profile-loaded';
import type { CreatorProfileError } from '@application/creators/profile/states/creator-profile-error';

/** The creator page's header: the profile as this viewer sees it. */
export type CreatorProfileState =
  | CreatorProfileIdle
  | CreatorProfileLoading
  | CreatorProfileLoaded
  | CreatorProfileError;
