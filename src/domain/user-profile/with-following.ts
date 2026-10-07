import { ViewerReaction } from '@domain/common/viewer-reaction';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

/**
 * The same viewed profile after the viewer follows (`true`) or unfollows
 * (`false`) it.
 *
 * @remarks
 * - **A no-op when nothing changes**, so asking twice never counts twice.
 * - **The count never goes below zero**, however stale the number on screen
 *   (both from {@link ViewerReaction}).
 */
export const withFollowing = (viewed: ViewedUserProfile, following: boolean): ViewedUserProfile => {
  if (viewed.isFollowedByMe === following) return viewed;
  const next = ViewerReaction.of(viewed.followerCount, viewed.isFollowedByMe).set(following);
  return { ...viewed, isFollowedByMe: next.mine, followerCount: next.count };
};
