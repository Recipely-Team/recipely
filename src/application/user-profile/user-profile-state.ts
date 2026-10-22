import type { UserProfileIdle } from '@application/user-profile/states/user-profile-idle';
import type { UserProfileLoading } from '@application/user-profile/states/user-profile-loading';
import type { UserProfileLoaded } from '@application/user-profile/states/user-profile-loaded';
import type { UserProfileError } from '@application/user-profile/states/user-profile-error';

export type UserProfileState =
  | UserProfileIdle
  | UserProfileLoading
  | UserProfileLoaded
  | UserProfileError;
