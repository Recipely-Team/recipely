import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import { withFollowing } from '@domain/user-profile/with-following';

const viewedOf = (followerCount: number, isFollowedByMe: boolean): ViewedUserProfile => {
  const profile = UserProfileEntity.create({
    id: 'u-1',
    displayName: 'Ada',
    bio: null,
    photoUrl: null,
    recipeCount: 3,
    totalLikes: 0,
    totalViews: 0,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    creator: null,
  });
  if (!profile.ok) throw new Error('fixture profile invalid');
  return { profile: profile.value, followerCount, isFollowedByMe };
};

describe('withFollowing', () => {
  it('counts the viewer in when they follow', () => {
    const next = withFollowing(viewedOf(4, false), true);

    expect(next.isFollowedByMe).toBe(true);
    expect(next.followerCount).toBe(5);
  });

  it('counts the viewer out when they unfollow', () => {
    const next = withFollowing(viewedOf(4, true), false);

    expect(next.isFollowedByMe).toBe(false);
    expect(next.followerCount).toBe(3);
  });

  it('changes nothing when the standing is already the asked one', () => {
    const viewed = viewedOf(4, true);

    expect(withFollowing(viewed, true)).toBe(viewed);
  });

  it('never counts below zero from a stale number', () => {
    expect(withFollowing(viewedOf(0, true), false).followerCount).toBe(0);
  });
});
