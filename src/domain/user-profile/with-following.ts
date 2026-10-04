import { ValueConstants } from '@core/constants';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

/**
 * The same viewed profile after the viewer follows (`true`) or unfollows
 * (`false`) it.
 *
 * @remarks
 * - **A no-op when nothing changes**, so asking twice never counts twice.
 * - **The count never goes below zero**, however stale the number on screen.
 */
export const withFollowing = (viewed: ViewedUserProfile, following: boolean): ViewedUserProfile => {
  if (viewed.isFollowedByMe === following) return viewed;
  const step = following ? ValueConstants.one : -ValueConstants.one;
  return {
    ...viewed,
    isFollowedByMe: following,
    followerCount: Math.max(ValueConstants.zero, viewed.followerCount + step),
  };
};
